import { Server } from "ssh2";
import { readFileSync, existsSync } from "fs";

// ─── Host key ────────────────────────────────────────────────────────────────
// In production: set HOST_KEY env var to the base64-encoded private key.
// Locally:       run `npm run keygen` to generate ./host_key, then start.
function loadHostKey() {
  if (process.env.HOST_KEY) {
    return Buffer.from(process.env.HOST_KEY, "base64");
  }
  if (existsSync("./host_key")) {
    return readFileSync("./host_key");
  }
  console.error(
    "No host key found.\n" +
    "Run `npm run keygen` to generate one, or set the HOST_KEY env var."
  );
  process.exit(1);
}

// ─── ANSI helpers ────────────────────────────────────────────────────────────
const R  = "\x1b[0m";
const B  = "\x1b[1m";
const DIM = "\x1b[2m";
const IT = "\x1b[3m";
const ACCENT  = "\x1b[38;5;39m";   // blue  (matches site light mode)
const ACCENT2 = "\x1b[38;5;208m";  // orange (matches site dark mode)
const MUTED   = "\x1b[38;5;245m";

const c  = (s) => `${ACCENT}${s}${R}`;
const c2 = (s) => `${ACCENT2}${s}${R}`;
const b  = (s) => `${B}${s}${R}`;
const dim = (s) => `${MUTED}${s}${R}`;
const it  = (s) => `${IT}${s}${R}`;

const CLEAR = "\x1b[2J\x1b[H";
const NL = "\r\n";

// ─── Content ─────────────────────────────────────────────────────────────────
const SOLAR_CAR = [
  `         ${ACCENT}┌──────────┐${R}         ${ACCENT}┌──────────┐${R}`,
  `         ${ACCENT}│${ACCENT2}░░░░░░░░░░${ACCENT}│${R}         ${ACCENT}│${ACCENT2}░░░░░░░░░░${ACCENT}│${R}`,
  `         ${ACCENT}│${ACCENT2}░░░░░░░░░░${ACCENT}│${R}         ${ACCENT}│${ACCENT2}░░░░░░░░░░${ACCENT}│${R}`,
  `    ${ACCENT}┌────┴──────────┴─────────┴──────────┴────┐${R}`,
  `    ${ACCENT}│${R}                                           ${ACCENT}│${R}`,
  `    ${ACCENT}└───────────────────────────────────────────┘${R}`,
  `          ${MUTED}◯${R}                                 ${MUTED}◯${R}`,
].join(NL);

const BANNER = [
  NL,
  `  ${B}${ACCENT}Jasper Japp${R}`,
  `  ${IT}${MUTED}always be optimising${R}`,
  NL,
  SOLAR_CAR,
  NL,
  `  ${MUTED}Engineer · ANU · Canberra, Australia${R}`,
  `  ${MUTED}jasperjapp.com${R}`,
  NL,
  `  ${DIM}Type ${R}${c("help")}${DIM} to see what you can do.${R}`,
  NL,
].join(NL);

const PROJECTS = [
  NL,
  `  ${b("Projects")}`,
  NL,
  `  ${c("01")}  Solar Car Aerodynamics`,
  `      ${dim("Catamaran solar car body · ANSYS Fluent · carbon composites")}`,
  `      ${dim("~20% CdA reduction · competed in 2025 BWSC")}`,
  NL,
  `  ${c("02")}  Early Bushfire Detection`,
  `      ${dim("GRU-based VAE on IoT sensors · STM32WLE5 LoRa node")}`,
  `      ${dim("100% hit rate across 8 ignitions · ~4 min avg detection")}`,
  NL,
  `  ${c("03")}  Carbon Bulkheads and Interfacing`,
  `      ${dim("Carbon-fibre sandwich panels · full subsystem integration")}`,
  NL,
  `  ${c("04")}  Canopy Opening Mechanism`,
  `      ${dim("Four-bar hinge for driver egress · regulations compliant")}`,
  NL,
  `  ${c("05")}  Solar Array Hinging`,
  `      ${dim("Tilt mechanism for roadside charging · 60 deg range")}`,
  NL,
  `  ${c("06")}  Transparent Light Covers`,
  `      ${dim("Vacuum-formed PETG covers · passed scrutineering")}`,
  NL,
  `  ${dim("Full write-ups at")} jasperjapp.com`,
  NL,
].join(NL);

const ABOUT = [
  NL,
  `  ${b("About")}`,
  NL,
  `  Engineering (Honours) graduate from the Australian National University.`,
  `  Major in Electronics & Communication Systems,`,
  `  minor in Mechatronic Systems. ${c2("First Class Honours")}.`,
  NL,
  `  I've spent the last few years building solar cars, running CFD,`,
  `  laying up carbon fibre, and teaching sensors to detect bushfires.`,
  `  What I enjoy most is turning messy, hard problems into things`,
  `  that actually work in practice.`,
  NL,
  `  ${b("Currently")}`,
  `  ${dim("·")} Open to graduate engineering roles in Australia`,
  `  ${dim("·")} Based in Canberra`,
  `  ${dim("·")} Working on a compact wireless communications project`,
  NL,
  `  ${b("Outside of engineering")}`,
  `  ${dim("·")} Good coffee (seriously)`,
  `  ${dim("·")} Skiing`,
  `  ${dim("·")} Team sports`,
  NL,
].join(NL);

const CONTACT = [
  NL,
  `  ${b("Contact")}`,
  NL,
  `  ${c("Email")}     jasperjapp@gmail.com`,
  `  ${c("LinkedIn")}  linkedin.com/in/jasper-japp`,
  `  ${c("Web")}       jasperjapp.com`,
  NL,
  `  ${it(dim("I'm always happy to talk engineering."))}`,
  NL,
].join(NL);

const HELP = [
  NL,
  `  ${b("Commands")}`,
  NL,
  `  ${c("help")}      show this`,
  `  ${c("projects")}  list all projects`,
  `  ${c("about")}     about me`,
  `  ${c("contact")}   get in touch`,
  `  ${c("clear")}     clear the screen`,
  `  ${c("exit")}      disconnect`,
  NL,
].join(NL);

// ─── Per-connection handler ───────────────────────────────────────────────────
function handleClient(client, info) {
  console.log(`Connection from ${info.ip}`);

  client.on("authentication", (ctx) => ctx.accept());

  client.on("ready", () => {
    client.on("session", (acceptSession) => {
      const session = acceptSession();

      session.on("pty", (accept) => accept());

      session.on("shell", (accept) => {
        const stream = accept();

        stream.write(BANNER);
        prompt(stream);

        let buf = "";

        stream.on("data", (data) => {
          const str = data.toString();

          for (const ch of str) {
            if (ch === "\r" || ch === "\n") {
              stream.write(NL);
              handleCommand(stream, buf.trim().toLowerCase());
              buf = "";
              prompt(stream);
            } else if (ch === "\x7f" || ch === "\b") {
              if (buf.length > 0) {
                buf = buf.slice(0, -1);
                stream.write("\b \b");
              }
            } else if (ch === "\x03" || ch === "\x04") {
              // Ctrl+C / Ctrl+D
              stream.write(NL);
              stream.exit(0);
              stream.end();
              return;
            } else if (ch >= " ") {
              buf += ch;
              stream.write(ch);
            }
          }
        });

        stream.on("close", () => client.end());
      });
    });
  });

  client.on("close", () => console.log(`Disconnected ${info.ip}`));
  client.on("error", () => {});
}

function prompt(stream) {
  stream.write(`${MUTED}guest${R}${DIM}@${R}${ACCENT}jasperjapp.com${R} ${DIM}$${R} `);
}

function handleCommand(stream, cmd) {
  switch (cmd) {
    case "help":      stream.write(HELP);     break;
    case "projects":  stream.write(PROJECTS); break;
    case "about":     stream.write(ABOUT);    break;
    case "contact":   stream.write(CONTACT);  break;
    case "clear":     stream.write(CLEAR + BANNER); break;
    case "exit":
    case "quit":
    case "q":
      stream.write(`${NL}  ${dim("bye")}${NL}${NL}`);
      stream.exit(0);
      stream.end();
      break;
    case "":
      break;
    default:
      stream.write(
        `${NL}  ${MUTED}Unknown command: ${R}${cmd}${NL}` +
        `  ${DIM}Type ${R}${c("help")}${DIM} for available commands.${R}${NL}${NL}`
      );
  }
}

// ─── Server ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "22");

const server = new Server({ hostKeys: [loadHostKey()] }, handleClient);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SSH server listening on port ${PORT}`);
});
