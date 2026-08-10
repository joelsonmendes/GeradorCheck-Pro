import { GState, jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AppSettings, LicenseSnapshot, ServiceRecord } from "../types";
import { formatDate, formatDateTime } from "./format";
import { sanitizeFilename } from "./media";

const COLORS = {
  navy: [6, 19, 34] as [number, number, number],
  cyan: [25, 211, 255] as [number, number, number],
  amber: [255, 176, 32] as [number, number, number],
  green: [22, 148, 93] as [number, number, number],
  red: [210, 66, 84] as [number, number, number],
  muted: [91, 111, 128] as [number, number, number],
  line: [213, 225, 234] as [number, number, number],
  light: [242, 247, 250] as [number, number, number],
};

function value(input?: string | null) {
  return input?.trim() || "—";
}

function statusLabel(status: string) {
  return (
    (
      {
        ok: "CONFORME",
        attention: "ATENÇÃO",
        na: "N/A",
        pending: "NÃO AVALIADO",
      } as Record<string, string>
    )[status] ?? status
  );
}

function checkbox(value: boolean) {
  return value ? "SIM" : "NÃO";
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(...COLORS.navy);
  doc.roundedRect(14, y, 182, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), 18, y + 6);
  return y + 13;
}

function ensureSpace(doc: jsPDF, y: number, required = 36) {
  if (y + required > 276) {
    doc.addPage();
    return 22;
  }
  return y;
}

function drawHeader(doc: jsPDF, service: ServiceRecord, settings: AppSettings) {
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFillColor(...COLORS.cyan);
  doc.roundedRect(14, 7, 13, 13, 3, 3, "F");
  doc.setTextColor(...COLORS.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("G", 18.4, 16.5);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text("GERADORCHECK", 32, 12.5);
  doc.setTextColor(...COLORS.cyan);
  doc.text("PRO", 75.5, 12.5);
  doc.setTextColor(190, 211, 226);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text(
    value(settings.businessName) === "—"
      ? "RELATÓRIO DE MANUTENÇÃO"
      : settings.businessName,
    32,
    19,
  );
  doc.setFillColor(...COLORS.amber);
  doc.roundedRect(148, 7, 48, 13, 3, 3, "F");
  doc.setTextColor(...COLORS.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(service.orderNumber, 172, 15.2, { align: "center" });
}

export function createServicePdf(
  service: ServiceRecord,
  settings: AppSettings,
  license: LicenseSnapshot | null,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  drawHeader(doc, service, settings);
  let y = 35;

  y = sectionTitle(doc, "Cliente e atendimento", y);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2.3,
      lineColor: COLORS.line,
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: COLORS.light,
      textColor: COLORS.navy,
      fontStyle: "bold",
    },
    body: [
      [
        "Cliente",
        value(service.customer.name),
        "Responsável",
        value(service.customer.responsible),
      ],
      [
        "Documento",
        value(service.customer.document),
        "Telefone",
        value(service.customer.phone),
      ],
      [
        "E-mail",
        value(service.customer.email),
        "Data",
        formatDate(service.service.startDate),
      ],
      [
        "Endereço",
        value(service.customer.address),
        "Tipo de serviço",
        value(service.service.type),
      ],
      [
        "Técnico",
        value(service.service.technician),
        "Horário",
        `${value(service.service.startTime)} às ${value(service.service.endTime)}`,
      ],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 24 },
      2: { fontStyle: "bold", cellWidth: 25 },
    },
  });
  y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 7;

  y = sectionTitle(doc, "Identificação do grupo gerador", y);
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2.3,
      lineColor: COLORS.line,
      lineWidth: 0.25,
    },
    body: [
      [
        "Fabricante",
        value(service.equipment.manufacturer),
        "Modelo",
        value(service.equipment.model),
      ],
      [
        "Número de série",
        value(service.equipment.serialNumber),
        "Potência",
        service.equipment.powerKva ? `${service.equipment.powerKva} kVA` : "—",
      ],
      [
        "Combustível",
        value(service.equipment.fuel),
        "Horímetro",
        service.equipment.hourmeter ? `${service.equipment.hourmeter} h` : "—",
      ],
      [
        "Controlador",
        value(service.equipment.controller),
        "Local",
        value(service.equipment.location),
      ],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 27 },
      2: { fontStyle: "bold", cellWidth: 26 },
    },
  });
  y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 7;

  y = ensureSpace(doc, y, 60);
  y = sectionTitle(doc, "Checklist técnico — 19 pontos", y);
  autoTable(doc, {
    startY: y,
    head: [["#", "Categoria", "Item inspecionado", "Resultado", "Observação"]],
    body: service.checklist.map((item, index) => [
      String(index + 1),
      item.category,
      item.label,
      statusLabel(item.status),
      value(item.observation),
    ]),
    theme: "grid",
    styles: {
      fontSize: 7.2,
      cellPadding: 1.8,
      lineColor: COLORS.line,
      lineWidth: 0.2,
      valign: "middle",
    },
    headStyles: {
      fillColor: COLORS.navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 28 },
      2: { cellWidth: 70 },
      3: { cellWidth: 24, fontStyle: "bold" },
      4: { cellWidth: 52 },
    },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 3) {
        const label = String(data.cell.raw);
        data.cell.styles.textColor =
          label === "CONFORME"
            ? COLORS.green
            : label === "ATENÇÃO"
              ? COLORS.red
              : COLORS.muted;
      }
    },
  });
  y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 7;

  y = ensureSpace(doc, y, 65);
  y = sectionTitle(doc, "Medições elétricas e mecânicas", y);
  autoTable(doc, {
    startY: y,
    head: [["Grandeza", "Valor", "Grandeza", "Valor", "Grandeza", "Valor"]],
    body: [
      [
        "Tensão L1-L2",
        value(service.measurements.voltageL1L2),
        "Tensão L2-L3",
        value(service.measurements.voltageL2L3),
        "Tensão L3-L1",
        value(service.measurements.voltageL3L1),
      ],
      [
        "Corrente L1",
        value(service.measurements.currentL1),
        "Corrente L2",
        value(service.measurements.currentL2),
        "Corrente L3",
        value(service.measurements.currentL3),
      ],
      [
        "Frequência",
        value(service.measurements.frequency),
        "Tensão bateria",
        value(service.measurements.batteryVoltage),
        "Carga",
        value(service.measurements.loadPercent),
      ],
      [
        "Temperatura",
        value(service.measurements.coolantTemperature),
        "Pressão do óleo",
        value(service.measurements.oilPressure),
        "Rotação",
        value(service.measurements.rpm),
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 7.6,
      cellPadding: 2.2,
      lineColor: COLORS.line,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.light,
      textColor: COLORS.navy,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { fontStyle: "bold" },
      2: { fontStyle: "bold" },
      4: { fontStyle: "bold" },
    },
  });
  y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 7;

  y = ensureSpace(doc, y, 65);
  y = sectionTitle(doc, "Teste do QTA", y);
  autoTable(doc, {
    startY: y,
    body: [
      [
        "Rede disponível",
        checkbox(service.qta.utilityAvailable),
        "Modo automático",
        checkbox(service.qta.automaticMode),
      ],
      [
        "Partida automática",
        checkbox(service.qta.automaticStart),
        "Transferência para gerador",
        checkbox(service.qta.transferToGenerator),
      ],
      [
        "Retorno para rede",
        checkbox(service.qta.returnToUtility),
        "Ciclo de resfriamento",
        checkbox(service.qta.cooldownPerformed),
      ],
      [
        "Tempo de partida",
        value(service.qta.startDelaySeconds),
        "Tempo de transferência",
        value(service.qta.transferSeconds),
      ],
      [
        "Tempo de retorno",
        value(service.qta.returnSeconds),
        "Resultado",
        service.qta.result === "approved"
          ? "APROVADO"
          : service.qta.result === "attention"
            ? "ATENÇÃO"
            : "NÃO TESTADO",
      ],
      ["Observações", value(service.qta.notes), "", ""],
    ],
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: COLORS.line,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35 },
      2: { fontStyle: "bold", cellWidth: 39 },
    },
  });
  y =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 7;

  const narrativeSections: [string, string][] = [
    ["Serviços executados", service.servicesPerformed],
    ["Peças e materiais", service.partsReplaced],
    ["Conclusão técnica", service.conclusion],
    ["Recomendações", service.recommendations],
  ];
  for (const [title, content] of narrativeSections) {
    y = ensureSpace(doc, y, 34);
    y = sectionTitle(doc, title, y);
    const lines = doc.splitTextToSize(value(content), 174) as string[];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.navy);
    doc.text(lines, 18, y + 2);
    y += Math.max(12, lines.length * 4.2 + 6);
  }

  if (service.photos.length) {
    y = ensureSpace(doc, y, 70);
    y = sectionTitle(doc, "Evidências fotográficas", y);
    for (let index = 0; index < service.photos.length; index += 2) {
      y = ensureSpace(doc, y, 70);
      const row = service.photos.slice(index, index + 2);
      row.forEach((photo, column) => {
        const x = column === 0 ? 14 : 107;
        try {
          doc.addImage(photo.dataUrl, "JPEG", x, y, 89, 55, undefined, "FAST");
          doc.setFontSize(7.5);
          doc.setTextColor(...COLORS.muted);
          doc.text(
            doc.splitTextToSize(value(photo.caption), 86),
            x + 2,
            y + 60,
          );
        } catch {
          doc.setDrawColor(...COLORS.line);
          doc.rect(x, y, 89, 55);
          doc.text("Imagem indisponível", x + 44.5, y + 28, {
            align: "center",
          });
        }
      });
      y += 70;
    }
  }

  y = ensureSpace(doc, y, 70);
  y = sectionTitle(doc, "Validação e assinaturas", y);
  const signatures = [
    {
      label: `Técnico: ${value(service.service.technician)}`,
      image: service.technicianSignature,
      x: 18,
    },
    {
      label: `Cliente: ${value(service.customerSignerName)}`,
      image: service.customerSignature,
      x: 108,
    },
  ];
  for (const signature of signatures) {
    if (signature.image) {
      try {
        doc.addImage(
          signature.image,
          "PNG",
          signature.x,
          y,
          80,
          31,
          undefined,
          "FAST",
        );
      } catch {
        /* imagem opcional */
      }
    }
    doc.setDrawColor(...COLORS.muted);
    doc.line(signature.x, y + 35, signature.x + 80, y + 35);
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(signature.label, signature.x + 40, y + 40, { align: "center" });
  }

  const pages = doc.getNumberOfPages();
  const isTrial = license?.status !== "active";
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    if (page > 1) drawHeader(doc, service, settings);
    if (isTrial) {
      doc.saveGraphicsState();
      doc.setTextColor(220, 66, 82);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(34);
      doc.setGState(new GState({ opacity: 0.12 }));
      doc.text("VERSÃO DE TESTE", 105, 158, { align: "center", angle: 35 });
      doc.restoreGraphicsState();
    }
    doc.setDrawColor(...COLORS.line);
    doc.line(14, 285, 196, 285);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.7);
    doc.setTextColor(...COLORS.muted);
    const licensedTo =
      license?.status === "active"
        ? `Licenciado para: ${license.ownerCompany || license.ownerName} • Licença ${license.licenseCode ?? "—"}`
        : "Versão de teste — relatório com marca d'água";
    doc.text(licensedTo, 14, 290);
    doc.text(
      `Emitido em ${formatDateTime(new Date().toISOString())} • Página ${page}/${pages}`,
      196,
      290,
      { align: "right" },
    );
  }

  const filename = `${sanitizeFilename(service.orderNumber)}-${sanitizeFilename(service.customer.name || "cliente")}.pdf`;
  return { doc, blob: doc.output("blob"), filename };
}
