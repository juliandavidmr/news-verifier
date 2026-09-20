import { describe, expect, it } from "vitest";
import { assessOcrQuality, parseTsvWordSignals } from "./ocr-quality";

describe("OCR quality assessment", () => {
  const readable =
    "This is a sufficiently long and readable sentence containing enough words for a news verification report.";

  it("accepts readable text with a reliable confidence score", () => {
    expect(assessOcrQuality(readable, 70).text).toBe(readable);
  });

  it("rejects plausible-looking transliteration with low confidence", () => {
    expect(() => assessOcrQuality(readable, 53)).toThrow(
      "ocr_quality_insufficient",
    );
  });

  it("removes only low-confidence isolated OCR artifacts", () => {
    const noisy =
      "Echan al director del DANE por dar una rueda de prensa y decir que las cifras entregadas por el | gobierno anterior son correctas y que no hay q evidencia de manipulación. \\ Ponen a uno nuevo y le prohíben dar ruedas de - prensa siendo el DANE una institución E descentralizada y con independencia técnica.";
    const cleaned = assessOcrQuality(noisy, 90, [
      { text: "|", confidence: 18 },
      { text: "q", confidence: 12 },
      { text: "\\", confidence: 7 },
      { text: "-", confidence: 15 },
      { text: "E", confidence: 9 },
    ]);

    expect(cleaned.text).toBe(
      "Echan al director del DANE por dar una rueda de prensa y decir que las cifras entregadas por el gobierno anterior son correctas y que no hay evidencia de manipulación. Ponen a uno nuevo y le prohíben dar ruedas de prensa siendo el DANE una institución E descentralizada y con independencia técnica.",
    );
  });

  it("preserves valid standalone letters even when their confidence is low", () => {
    const multilingual =
      "A notícia é clara e a evidência continua disponível; I agree, y el documento también mantiene su sentido original.";

    expect(
      assessOcrQuality(multilingual, 90, [
        { text: "A", confidence: 10 },
        { text: "e", confidence: 10 },
        { text: "a", confidence: 10 },
        { text: "é", confidence: 10 },
        { text: "I", confidence: 10 },
        { text: "y", confidence: 10 },
      ]).text,
    ).toBe(multilingual);
  });

  it("preserves legitimate isolated characters when confidence is high", () => {
    const legitimate =
      "La comparación A | B y la opción E permanecen visibles; la ruta C:\\Datos también se conserva correctamente.";

    expect(
      assessOcrQuality(legitimate, 91, [
        { text: "A", confidence: 94 },
        { text: "|", confidence: 96 },
        { text: "B", confidence: 95 },
        { text: "E", confidence: 93 },
      ]).text,
    ).toBe(legitimate);
  });

  it("does not guess when word confidence data is unavailable", () => {
    const uncertain =
      "Este texto suficientemente largo conserva el símbolo \\ porque no existe evidencia local para clasificarlo como ruido del OCR.";

    expect(assessOcrQuality(uncertain, 90).text).toBe(uncertain);
  });

  it("parses only word rows with usable confidence from Tesseract TSV", () => {
    const tsv = [
      "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext",
      "4\t1\t1\t1\t1\t0\t0\t0\t100\t20\t-1\t",
      "5\t1\t1\t1\t1\t1\t0\t0\t20\t20\t92.5\tTexto",
      "5\t1\t1\t1\t1\t2\t25\t0\t5\t20\t8.0\t\\",
      "malformed row",
    ].join("\n");

    expect(parseTsvWordSignals(tsv)).toEqual([
      { text: "Texto", confidence: 92.5 },
      { text: "\\", confidence: 8 },
    ]);
  });
});
