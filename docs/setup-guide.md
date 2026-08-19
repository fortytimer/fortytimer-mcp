# fortyTimer Desktop Extension – Setup Guide / Einrichtungsanleitung

*This page is the public documentation for the fortyTimer Desktop Extension.*
*Deutsche Fassung siehe unten.*

## What it does

The extension connects Claude (Desktop) to your fortyTimer installation with
**read-only** access: flextime and vacation balances, work and project time
entries and leave requests. Visibility exactly matches your fortyTimer
account – an employee sees only their own data, supervisors see their
approver groups, admins see all users. Nothing can be created, changed or
deleted through the extension.

## Prerequisites

1. Your fortyTimer license includes the module **“fortyTimer API”**
   (visible under *Admin → License → Add-on modules*). Ask your
   administrator if it is missing.
2. Claude Desktop (Windows or macOS).

## Setup (3 steps)

1. **Create your API token:** In fortyTimer open *Profile → Security*
   (your current password is required), scroll to **fortyTimer API →
   API tokens**, enter a name (e.g. “Claude Desktop”) and click
   **Create token**. Copy the token now – it is shown only once.
2. **Install the extension:** Double-click the `fortytimer-<version>.mcpb`
   file (or drag it into *Claude Desktop → Settings → Extensions*).
3. **Configure:** Enter your **fortyTimer URL** (e.g.
   `https://42.fortytimer.de`; for subdirectory installations include the
   path, e.g. `https://example.com/fortytimer/public` – the same address you
   use to log in, without `/login`) and paste your **API token**. Save.

Try it: ask Claude *“What is my flextime balance?”* or
*“Which of my leave requests are pending?”*

## Frequently asked questions

- **HTTP 403:** The license module is missing, the token was revoked, or the
  account is deactivated.
- **HTTP 404 on every call:** The URL is missing the installation path –
  use the same base address as your login page (without `/login`).
- **Revoke access:** fortyTimer → *Profile → Security → API tokens → Delete*.
  Effective immediately. Up to 5 tokens per user are possible.
- **What does my employer see?** Token creation and deletion appear in the
  fortyTimer audit log as security events. The content of your Claude
  conversations is never visible to fortyTimer.

---

# Einrichtungsanleitung (Deutsch)

## Was die Erweiterung kann

Die Erweiterung verbindet Claude (Desktop) mit eurer fortyTimer-Installation
– **ausschließlich lesend**: Gleitzeit- und Urlaubssalden, Arbeits- und
Projektzeiten sowie Anträge. Die Sichtbarkeit entspricht exakt deinem
fortyTimer-Konto – Mitarbeiter sehen nur sich selbst, Vorgesetzte ihre
Genehmigergruppen, Administratoren alle Anwender. Anlegen, Ändern oder
Löschen ist über die Erweiterung grundsätzlich nicht möglich.

## Voraussetzungen

1. Die fortyTimer-Lizenz enthält das Zusatzmodul **„fortyTimer API"**
   (sichtbar unter *Admin → Lizenz → Zusatzmodule*). Falls nicht: an den
   Administrator wenden.
2. Claude Desktop (Windows oder macOS).

## Einrichtung (3 Schritte)

1. **API-Token erstellen:** In fortyTimer *Profil → Sicherheit* öffnen
   (aktuelles Passwort erforderlich), zur Karte **fortyTimer API →
   API-Tokens** scrollen, einen Namen vergeben (z. B. „Claude Desktop") und
   **Token erstellen** klicken. Das Token jetzt kopieren – es wird nur ein
   einziges Mal angezeigt.
2. **Erweiterung installieren:** Die Datei `fortytimer-<version>.mcpb`
   doppelklicken (oder in *Claude Desktop → Einstellungen → Erweiterungen*
   ziehen).
3. **Konfigurieren:** **fortyTimer-URL** eintragen (z. B.
   `https://42.fortytimer.de`; bei Unterverzeichnis-Installationen mit Pfad,
   z. B. `https://example.de/fortytimer/public` – dieselbe Adresse wie die
   Anmeldeseite, ohne `/login`) und das **API-Token** einfügen. Speichern.

Ausprobieren: Frag Claude *„Wie ist mein Gleitzeitstand?"* oder
*„Welche meiner Anträge sind offen?"*

## Häufige Fragen

- **HTTP 403:** Lizenz-Modul fehlt, Token widerrufen oder Konto deaktiviert.
- **HTTP 404 bei jedem Aufruf:** Der URL fehlt der Installationspfad –
  dieselbe Basisadresse wie die Anmeldeseite verwenden (ohne `/login`).
- **Zugriff widerrufen:** fortyTimer → *Profil → Sicherheit → API-Tokens →
  Löschen*. Wirkt sofort. Je Anwender sind bis zu 5 Tokens möglich.
- **Was sieht mein Arbeitgeber?** Erstellung und Löschung von Tokens stehen
  als Sicherheitsereignis im fortyTimer-Protokoll. Die Inhalte deiner
  Claude-Unterhaltungen sind für fortyTimer niemals sichtbar.
