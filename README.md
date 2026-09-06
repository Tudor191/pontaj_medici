# 🩺 Pontaj Medici

Bot Discord pentru gestionarea pontajului medicilor pe server — pornire/oprire tură cu un click, dashboard live cu cine e de gardă, sincronizare automată cu Google Sheets și câteva utilitare de evidență pentru activitatea de pe server.

---

## ✨ Ce face

### 🕐 Pontaj cu un click
Panoul principal pune la dispoziție un buton simplu de **pornire/oprire** a turei. Timpul acumulat se salvează automat, persistă la restart-uri, iar oricine își poate verifica oricând pontajul total.

### 📡 Dashboard live cu cine e de gardă
O singură comandă afișează o listă live cu toți membrii care au un callsign (`[M-xxx]`) în nickname. De atunci încolo, lista se actualizează **singură**, fără să mai fie nevoie să o rulezi din nou:

- cine pornește tura apare instant ca 🟢 **PORNIT**, cu durata ticăind live
- cine oprește rămâne vizibil ca ⚪ **OPRIT** doar 5 minute, apoi dispare din listă, ca să nu se umple de nume vechi
- durata de gardă e afișată nativ, fără să consume request-uri suplimentare către Discord

### 📊 Sincronizare cu Google Sheets
Minutele de gardă ale fiecărei zile se scriu automat într-un Google Sheet, pe baza callsign-ului din nickname-ul fiecăruia — se actualizează automat inclusiv atunci când cineva își schimbă nickname-ul.

### 🔍 Verificări & clasament
- pontajul total al oricărui membru, la cerere
- verificare rapidă dacă cineva are tura pornită
- clasament cu top 3 după timp acumulat

### 🛠️ Administrare
- resetare completă a pontajelor, inclusiv în Google Sheet
- comutare globală public/privat pentru răspunsurile botului

### 📋 Evidențe de activitate
Comenzi dedicate pentru înregistrarea rapidă — cu poză și responsabil — a internărilor, administrării DETOX și operațiilor de scos tatuaje, fiecare cu numerotare automată și arhivă directă în canal.

---

## 🧭 Comenzi

| Comandă | Ce face |
|---|---|
| `/pontajmedici` | Afișează panoul cu butoane de pontaj |
| `/verificastatuspontaje` | Dashboard live cu toți cei de gardă |
| `/verificapontaj` | Pontajul total al unui membru |
| `/verificastatuspontajbackup` | Verificare rapidă pornit/oprit |
| `/topontaje` | Top 3 după timp acumulat |
| `/resetpontaj` | Resetează toate pontajele |
| `/setephemeral` | Public/privat pentru răspunsurile botului |
| `/internare` | Înregistrează o internare nouă |
| `/detox` | Înregistrează administrarea DETOX |
| `/operatietatuaje` | Înregistrează o operație de scos tatuaje |

---

## 📸 Demonstrație

> _capturi de ecran în curând_

---

## 🧰 Sub capotă

- **Node.js** 18+ · **discord.js** v14 · **Google Sheets API**
- date persistate local + sincronizare periodică în Sheets
- gestionare robustă a erorilor — o comandă care eșuează sau un timeout de rețea nu afectează restul botului
- teste automate pentru logica de calcul a pontajului

---

<sub>Bot dezvoltat și întreținut de [@Tudor191](https://github.com/Tudor191).</sub>
