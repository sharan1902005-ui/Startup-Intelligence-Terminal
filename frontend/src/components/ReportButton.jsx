import { Download } from "lucide-react";
import jsPDF from "jspdf";

export default function ReportButton({ prediction, metrics, vitals, similarStartups }) {
  const generateReport = () => {
    const doc = new jsPDF();
    doc.setFillColor(22, 27, 41);
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(241, 243, 248);
    doc.setFontSize(22);
    doc.text("Will It Survive?", 18, 24);
    doc.setFontSize(11);
    doc.setTextColor(128, 137, 163);
    doc.text("AI-powered startup intelligence report", 18, 32);

    doc.setTextColor(240, 164, 72);
    doc.setFontSize(16);
    doc.text(`Prediction: ${prediction.prediction}`, 18, 50);
    doc.setFontSize(11);
    doc.setTextColor(241, 243, 248);
    doc.text(`Confidence: ${prediction.confidence}%`, 18, 60);
    doc.text(`Risk Score: ${vitals.riskScore}%`, 18, 68);
    doc.text(`Total Funding: ${metrics.totalFundingLabel}`, 18, 82);
    doc.text(`Funding Rounds: ${metrics.roundCount}`, 18, 90);
    doc.text(`Funding Velocity: ${metrics.velocity}`, 18, 98);

    doc.setTextColor(240, 164, 72);
    doc.text("AI Explanation", 18, 116);
    doc.setTextColor(241, 243, 248);
    vitals.reasons.forEach((reason, index) => {
      doc.text(`- ${reason}`, 22, 126 + index * 8);
    });

    doc.setTextColor(240, 164, 72);
    doc.text("Similar Startups", 18, 160);
    doc.setTextColor(241, 243, 248);
    similarStartups.slice(0, 5).forEach((startup, index) => {
      doc.text(`${startup.name} - ${startup.similarity}% similar`, 22, 170 + index * 8);
    });

    doc.save("startup-investment-report.pdf");
  };

  if (!prediction) return null;

  return (
    <button
      type="button"
      onClick={generateReport}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#f0a448] px-4 text-sm font-semibold text-[#2e1c05] transition hover:brightness-110"
    >
      <Download className="h-4 w-4" />
      Generate Investment Report
    </button>
  );
}
