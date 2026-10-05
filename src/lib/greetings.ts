/**
 * Suggested personal messages for the admin panel. Each family sees its message when the invitation
 * opens (PersonalWelcome) and it also goes in the WhatsApp text. Written by "nosotras" (the twins),
 * with a plural form for families and a singular form for a guest invited alone.
 */

export type GreetingSuggestion = { label: string; plural: string; single: string };

export const GREETING_SUGGESTIONS: GreetingSuggestion[] = [
  {
    label: "Cariñoso",
    plural:
      "Hay noches que se sueñan desde pequeñas, y la nuestra por fin llegó. Para nosotras sería un honor que nos acompañen a vivirla.",
    single:
      "Hay noches que se sueñan desde pequeñas, y la nuestra por fin llegó. Para nosotras sería un honor que nos acompañes a vivirla.",
  },
  {
    label: "Familia cercana",
    plural:
      "Ustedes han sido parte de nuestra historia desde el primer día, y no imaginamos esta noche sin su presencia. ¡Los esperamos con todo nuestro cariño!",
    single:
      "Has sido parte de nuestra historia desde el primer día, y no imaginamos esta noche sin ti. ¡Te esperamos con todo nuestro cariño!",
  },
  {
    label: "Padrinos",
    plural:
      "Gracias por acompañarnos en cada paso y por ser parte tan especial de este sueño. Esta noche también es suya: nos llena de alegría celebrarla a su lado.",
    single:
      "Gracias por acompañarnos en cada paso y por ser parte tan especial de este sueño. Esta noche también es tuya: nos llena de alegría celebrarla a tu lado.",
  },
  {
    label: "Abuelitos",
    plural:
      "Gracias por su amor de siempre y por cada consejo. Su presencia será el regalo más bonito de nuestra noche.",
    single:
      "Gracias por tu amor de siempre y por cada consejo. Tu presencia será el regalo más bonito de nuestra noche.",
  },
  {
    label: "Amigos",
    plural:
      "Las mejores historias se escriben con quienes queremos. Nos encantaría que formen parte de esta noche mágica y que la celebremos juntos.",
    single:
      "Las mejores historias se escriben con quienes queremos. Nos encantaría que formes parte de esta noche mágica y que la celebremos juntos.",
  },
  {
    label: "Formal",
    plural:
      "Con la ilusión de dos corazones que celebran juntos, tenemos el gusto de invitarlos a compartir con nosotras una noche que guardaremos para siempre.",
    single:
      "Con la ilusión de dos corazones que celebran juntos, tenemos el gusto de invitarte a compartir con nosotras una noche que guardaremos para siempre.",
  },
];

/** The suggestion text for a family of `memberCount` people (one person → singular). */
export const suggestionText = (s: GreetingSuggestion, memberCount: number) => (memberCount === 1 ? s.single : s.plural);

/** Text used when the admin leaves the message empty. */
export const defaultGreeting = (memberCount: number) => suggestionText(GREETING_SUGGESTIONS[0], memberCount);

/** True when `text` is one of the suggestions in either form (so it can be re-adapted to singular/plural). */
export function findSuggestion(text: string) {
  const t = text.trim();
  return GREETING_SUGGESTIONS.find((s) => s.plural === t || s.single === t) ?? null;
}
