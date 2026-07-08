// Built-in service/ceremony catalog shown when building a bill.
// Each entry becomes a selectable, priced line item.
export interface CatalogService {
  key: string;
  title: string;
  description: string;
}

const D_TRAD = "1 TRADITIONAL PHOTOGRAPHY\n1 TRADITIONAL VIDEOGRAPHY";
const D_TRAD_CANDID = "1 TRADITIONAL PHOTOGRAPHY\n1 TRADITIONAL VIDEOGRAPHY\n1 CANDID PHOTOGRAPHY\n1 CINEMATIC VIDEO";

export const SERVICE_CATALOG: CatalogService[] = [
  { key: "pre_wedding", title: "PRE-WEDDING 1 DAY (WITHIN BLR)", description: "1 PRE WEDDING PHOTOGRAPHY\n1 PRE WEDDING VIDEOGRAPHY\n1 DRONE" },
  { key: "bride_departure", title: "BRIDE DEPARTURE (HOME TO WEDDING VENUE)", description: D_TRAD },
  { key: "groom_departure", title: "GROOM DEPARTURE (HOME TO WEDDING VENUE)", description: D_TRAD },
  { key: "pelli_kuthuru", title: "PELLI KUTHURU", description: D_TRAD },
  { key: "upanayana", title: "UPANAYANA", description: D_TRAD },
  { key: "venue_receiving_groom", title: "VENUE RECEIVING (GROOM)", description: D_TRAD },
  { key: "venue_receiving_bride", title: "VENUE RECEIVING (BRIDE)", description: D_TRAD },
  { key: "bangle_ceremony", title: "BANGLE CEREMONY", description: D_TRAD },
  { key: "baby_shower", title: "BABY SHOWER (6 HOURS)", description: D_TRAD_CANDID },
  { key: "birthday_event", title: "BIRTHDAY EVENT", description: D_TRAD_CANDID },
  { key: "haldi", title: "HALDI", description: D_TRAD_CANDID },
  { key: "mehendi", title: "MEHENDI", description: D_TRAD_CANDID },
  { key: "sangeet", title: "SANGEET", description: D_TRAD_CANDID },
  { key: "engagement", title: "ENGAGEMENT", description: D_TRAD_CANDID },
  { key: "muhurtham", title: "MUHURTHAM / WEDDING", description: "1 TRADITIONAL PHOTOGRAPHY\n1 TRADITIONAL VIDEOGRAPHY\n1 CANDID PHOTOGRAPHY\n1 CINEMATIC VIDEO\n1 LED WALL\n1 DRONE" },
  { key: "reception", title: "RECEPTION", description: "2 TRADITIONAL PHOTOGRAPHY\n1 TRADITIONAL VIDEOGRAPHY\n1 CANDID PHOTOGRAPHY\n1 CINEMATIC VIDEO\n1 LED WALL\n1 DRONE" },
];
