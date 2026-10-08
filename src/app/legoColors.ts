export const LEGO_COLORS = ["#C91A09", "#F2CD37", "#0055BF", "#237841", "#FE8A18"]; // red, yellow, blue, green, orange

export function randomLegoColor() {
  return LEGO_COLORS[Math.floor(Math.random() * LEGO_COLORS.length)];
}
