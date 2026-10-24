import source from "../../../data/joeski-press.json";
import { parsePressItems } from "../coverage";

export const JOESKI_PRESS = parsePressItems(source);
