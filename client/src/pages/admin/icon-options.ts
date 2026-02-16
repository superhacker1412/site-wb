export type IconOption = {
  value: string;
  label: string;
};

export const CATEGORY_ICON_OPTIONS: IconOption[] = [
  { value: "\u{1F43E}", label: "Animals" },
  { value: "\u{1F522}", label: "Numbers" },
  { value: "\u{1F9E9}", label: "Logic" },
  { value: "\u{1F33F}", label: "Nature" },
  { value: "\u{1F52C}", label: "Science" },
  { value: "\u{1F3A8}", label: "Creativity" },
  { value: "\u{1F4DA}", label: "Education" },
  { value: "\u{1F4BB}", label: "Technology" },
  { value: "\u{1F30D}", label: "World" },
  { value: "\u{1F6F8}", label: "Ideas" },
  { value: "\u{1F4A1}", label: "Innovation" },
  { value: "\u{1F3AF}", label: "Focus" },
];

export const DIRECTION_ICON_OPTIONS: IconOption[] = [
  { value: "\u{1F9E0}", label: "IQ / Brain" },
  { value: "\u{1F9E9}", label: "Logic" },
  { value: "\u{1F522}", label: "Math" },
  { value: "\u{1F3AF}", label: "Accuracy" },
  { value: "\u{1F4C8}", label: "Progress" },
  { value: "\u{1F525}", label: "Challenge" },
  { value: "\u{265F}", label: "Strategy" },
  { value: "\u{1F3C6}", label: "Competition" },
  { value: "\u{1F4A1}", label: "Ideas" },
  { value: "\u{1F680}", label: "Advanced" },
  { value: "\u{1F4D8}", label: "Knowledge" },
  { value: "\u{1F4AC}", label: "Communication" },
];

export function buildIconOptions(base: IconOption[], current: string): IconOption[] {
  if (!current) return base;
  if (base.some((option) => option.value === current)) return base;
  return [{ value: current, label: `Current (${current})` }, ...base];
}
