import type { ChecklistItem } from "../types";

export const CHECKLIST_TEMPLATE: Omit<
  ChecklistItem,
  "status" | "observation"
>[] = [
  {
    id: "general-condition",
    category: "Inspeção geral",
    label: "Condições gerais, limpeza e fixação do grupo gerador",
  },
  {
    id: "oil-level",
    category: "Motor",
    label: "Nível e condição do óleo lubrificante",
  },
  {
    id: "coolant",
    category: "Motor",
    label: "Nível do líquido e sistema de arrefecimento",
  },
  {
    id: "fuel",
    category: "Motor",
    label: "Sistema de combustível, mangueiras e conexões",
  },
  {
    id: "leaks",
    category: "Motor",
    label: "Ausência de vazamentos de óleo, combustível ou fluido",
  },
  {
    id: "filters",
    category: "Motor",
    label: "Filtros de óleo, combustível e ar",
  },
  {
    id: "belts",
    category: "Motor",
    label: "Correias, tensionamento e desgaste",
  },
  {
    id: "exhaust",
    category: "Motor",
    label: "Sistema de escapamento e ventilação",
  },
  {
    id: "battery",
    category: "Sistema elétrico",
    label: "Bateria, terminais, cabos e tensão",
  },
  {
    id: "charger",
    category: "Sistema elétrico",
    label: "Carregador e fonte auxiliar da bateria",
  },
  {
    id: "alternator",
    category: "Sistema elétrico",
    label: "Alternador, conexões e isolação aparente",
  },
  {
    id: "grounding",
    category: "Sistema elétrico",
    label: "Aterramento do grupo gerador e equipotencialização",
  },
  {
    id: "panel",
    category: "Comando e proteção",
    label: "Painel, disjuntores, contatores e sinalizações",
  },
  {
    id: "sensors",
    category: "Comando e proteção",
    label: "Sensores, alarmes e indicações do controlador",
  },
  {
    id: "emergency",
    category: "Comando e proteção",
    label: "Botão de emergência e proteções operacionais",
  },
  {
    id: "qta",
    category: "Transferência",
    label: "Quadro de Transferência Automática e intertravamentos",
  },
  {
    id: "no-load-test",
    category: "Teste funcional",
    label: "Partida, funcionamento e parada sem carga",
  },
  {
    id: "load-test",
    category: "Teste funcional",
    label: "Funcionamento com carga e estabilidade",
  },
  {
    id: "noise-vibration",
    category: "Teste funcional",
    label: "Ruídos, vibrações e aquecimentos anormais",
  },
];

export function createChecklist(): ChecklistItem[] {
  return CHECKLIST_TEMPLATE.map((item) => ({
    ...item,
    status: "pending",
    observation: "",
  }));
}
