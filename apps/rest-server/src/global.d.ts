import { Logger } from "pino";

export {};

declare global {
    var logger: Logger<never, boolean>;
}
  