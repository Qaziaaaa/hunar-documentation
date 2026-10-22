# WorkerFix Admin Guide: Verification Buttons
## (Admin Verification Actions in Roman Urdu)

Yeh document Admin Panel ke do buttons **"Reject Submission"** aur **"Request Changes"** ki mukammal detail, reasons aur ready-to-use notes explain karta hai.

---

## 📌 Quick Summary: Reject vs Request Changes

| Feature | ❌ Reject Submission | ⚠️ Request Changes |
| :--- | :--- | :--- |
| **Matlab (Concept)** | Application mukammal tor par reject (Permanent) | Application me ghalti hai, theek karne ka moqa (Fixable) |
| **Status Database me** | `REJECTED` | `REQUEST_CHANGES` |
| **Worker kya karega?** | Dubara edit nahi kar sakta, nayi application deni paregi | Apne Dashboard pe ja kar sirf required cheez theek kar ke re-submit karega |
| **Kab use karein?** | Fake CNIC, Fraud, 18 saal se kam umar, Blacklisted | Dhundli photo, Back side missing, Name typo |

---

## 1. ❌ Reject Submission (Kyun Reject Hoti Hai?)

Yeh button sirf tab use karna hai jab worker ki application me aisi khami ho jo **theek nahi ho sakti** ya worker ne fraud karne ki koshish ki ho.

### 🔴 Reject karne ki wajohat (Reasons for Rejection):

1. **Fake ya Edited CNIC (Jaali Dastavez):**
   - CNIC Photoshop kiya gaya ho ya numbers/tasveer edit ki gayi ho.
   - Kisi aur ka CNIC use kiya ho jo worker se match nahi karta.
   - NADRA record ke mutabiq details bilkul jaali hon.

2. **Duplicate Account (Ek hi CNIC par doosra account):**
   - Is CNIC par pehle se koi active worker account register ho chuka ho.

3. **Underage Worker (18 saal se kam umar):**
   - CNIC ki date of birth ke mutabiq worker ki umar 18 saal se kam ho (legal age poori na ho).

4. **Blacklisted ya Fraud Record:**
   - Worker ko pehle kisi customer ke sath fraud, badtameezi ya policy violation ki wajah se ban kiya gaya ho.

5. **Ineligible / Prohibited Category:**
   - Worker ne aisi kisi service ke liye apply kiya ho jo platform par allow nahi hai.

---

### 📝 Reject ke liye Admin Notes (Copy-Paste Templates):

* **Fake CNIC par:**
  > *"Aap ki verification request fake ya tampered CNIC ki wajah se reject kar di gayi hai. Platform par sirf original documents hi qabil-e-qabool hain."*

* **Duplicate Account par:**
  > *"Is CNIC number par pehle se ek account register hai. Platform policy ke mutabiq ek CNIC par doosra account nahi banaya ja sakta."*

* **Underage hone par:**
  > *"Platform par kaam karne ke liye kam az kam umar 18 saal hona zaroori hai. Aap ki umar is miyar par poori nahi utarti."*

---

## 2. ⚠️ Request Changes (Kia Kia Change Karwana Hai?)

Yeh button tab use karna hai jab worker genuine ho lekin documents ya form me koi aisi choti ghalti ho jise **worker theek kar sakta hai**.

### 🟡 Worker se kya change karwaya ja sakta hai:

#### A) CNIC aur Photos ke Maslay (Photos & Documents)
1. **Dhundli Tasveer (Blurry CNIC Photo):**
   - CNIC ki picture blur ho aur CNIC number, naam ya expiry date saaf parhi na ja rahi ho.
2. **Camera Flash / Chamak (Glare):**
   - Camera ki flash ki wajah se CNIC ka koi hissa chamak raha ho aur parha na ja sake.
3. **CNIC ki Back Side Missing:**
   - Worker ne sirf front upload kiya ho aur back side khali chor di ho ya ghalat image laga di ho.
4. **Koney Katay Huay Hona (Cropped Document):**
   - CNIC tasveer me poora na aa raha ho aur edges cut gayi hon.
5. **Ghalat Profile Photo (Unclear Selfie / Avatar):**
   - Worker ne chashma (sunglasses), mask, filter ya kisi cartoon ki tasveer lagayi ho. Clear face photo zaroori hai.

#### B) Personal Details aur Typing Mistakes
1. **Naam ka Farq (Name Mismatch):**
   - Portal form me likha gaya naam aur CNIC par likha naam match na kare (maslan: form par "Jani" likh diya ho jabke CNIC par "Muhammad Hashim" ho).
2. **CNIC Number ki Typo (Digits Error):**
   - Form me 13 digits ghalat type ho gaye hon.
3. **Service City / Area Mismatch:**
   - Shehar ya address me wazeh tazaad ho.

#### C) Skills aur Experience Proofs
1. **Experience ki Na-kaafi Detail:**
   - Kaam ke tajarbay me sirf 1-2 alfaz likh diye hon, detail na likhi ho.
2. **Technical Certificate Missing:**
   - Kisi technical kaam (jaise Solar, AC, Electrician) ke liye certificate ya proof manga jaye.

---

### 📝 Request Changes ke liye Admin Notes (Copy-Paste Templates):

* **Dhundli ya Flash wali Photo par:**
  > *"Apne CNIC ke Front aur Back ki clear aur saaf tasveer bina flash ke upload karein taake tamam numbers aur naam saaf parha ja sake."*

* **Naam / CNIC Typo theek karwane ke liye:**
  > *"Aap ka profile name aap ke CNIC se match nahi kar raha. Barah-e-karam apna naam CNIC ke mutabiq darust kar ke dobara submit karein."*

* **CNIC Back side missing hone par:**
  > *"Aap ke CNIC ki back side ki photo missing hai. Barah-e-karam back side upload kar ke dobara submit karein."*

* **Clear Selfie mangne ke liye:**
  > *"Barah-e-karam apni clear profile photo (selfie) upload karein jis me chashma ya mask na ho aur chehra saaf nazar aa raha ho."*

---

## 3. 🎯 Quick Decision Flow (Admin Kab Konsa Button Dabaye?)

```
Worker Application check karein
           │
           ├─ Kya CNIC original hai aur sab details theek hain?
           │       │
           │       ├─ Haan, sab documents 100% clear aur valid hain
           │       │      └──> [ Approve & Grant Badge ] 🟢
           │       │
           │       └─ CNIC original hai lekin photo blur hai ya naam me ghalti hai
           │              └──> [ Request Changes ] 🟠
           │
           └─ Kya document fake hai, age 18 se kam hai, ya fraud hai?
                  └──> [ Reject Submission ] 🔴
```

---

## 4. ⚙️ Backend API Details

- **Reject Submission:**
  - `PUT /admin/verifications/:userId/reject`
  - Body: `{ "reason": "Rejection reason yahan likhein" }`
  - Status ban jata hai: `REJECTED`

- **Request Changes:**
  - `PUT /admin/verifications/:userId/request-changes`
  - Body: `{ "adminNote": "Worker ko kya theek karna hai yahan likhein" }`
  - Status ban jata hai: `REQUEST_CHANGES`
