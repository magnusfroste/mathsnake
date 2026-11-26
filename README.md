# Mathsnake

Klassiska ormen med matte. En fråga i taget, tre äpplen med svar i spelplanen:
ätt rätt svar så blir ormen längre, fel svar krymper den. En minut per omgång.

Byggd för iPad (landskap) och telefon, utan inloggning, cookies eller
tredjepartsanrop. Allt körs i webbläsaren.

## Form och bildspråk

Regeln för den här åldern (förskoleklass–åk 2) är **inga ord i spelvyn**:

| Vad | Hur |
|---|---|
| Frågan | stora siffror och ett räknetecken, inget mer |
| Svaren | tre röda äpplen med vita siffror |
| Poängen | äpple + siffra i hörnet |
| Tiden | en grön linje som krymper, röd sista tiondelen |
| Slutet | äpple, siffra, en grön uppspelningsknapp |
| Styrning | tummen: spaken dyker upp där tummen sätts (Roblox-principen) |
| Peka-dit | ett kort tryck på ett äpple – ormen hittar vägen själv |

Text finns bara på startskärmen, där en vuxen läser.

## Spelregler

- Ormen går i ett rutnät (9–19 kolumner beroende på skärm, 11 rader).
- Två sätt att styra: håll tummen och dra (spaken följer tummen, släpper man
  fortsätter ormen åt samma håll) eller peka på ett äpple och låt ormen gå dit.
- Rätt äpple: ormen växer ett led, ny fråga, tre nya äpplen, något snabbare.
- Fel äpple: ormen krymper två led, äpplet byts mot ett annat fel svar och
  frågan står kvar.
- Vägg och egen kropp stoppar ormen men avslutar inte omgången – bara tiden
  kan ta slut. Inget barn blir "dött" av ett misstag.
- Frågorna trappas: plus inom 10 → plus inom 20 → blandat plus/minus inom 20.

## Filer

```
public/index.html      skal, SEO/AEO, JSON-LD, startskärm injicerad av start_screen.py
public/styles.css      delat formspråk (papper #faf7f2, Fredoka, en accentfärg)
public/app.js          spel, rendering på canvas, ljud, testkrok window.__snake
public/kort.png        katalogbild 1200×900 från riktig skärmdump
make_assets.py         ikon, favicon, og-bild (PIL)
deploy/nginx.conf      statisk servering, cache-rubriker
```

## Testkrok

`window.__snake` exponerar `S` (tillstånd), `tick()`, `sväng(dx,dy)`,
`starta()`, `sättFråga(a,b,op)`, `sättÄpplen([...])`, `placeraOrm([...])` –
mekaniken går att verifiera headless utan att spela.

## Publicering

`Dockerfile` serverar `public/` med nginx. Appen körs på shipholm:
<https://mathsnake.shipholm.dev/>. Katalogpost på skolappar.org.