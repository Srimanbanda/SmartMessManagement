#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <LittleFS.h>
#include <vector>

/* ---------------- CONFIGURATION ---------------- */
const char* ssid = "Hotspot";
const char* password = "987654321";
String SERVER = "http://172.17.143.91:3000/api/rfid"; 
String ADMIN_UID = "FFFFFFFF"; 

#define RST_PIN 4  
#define SS_A 5
#define SS_B 15
#define BUZZ_A 26
#define BUZZ_B 27

MFRC522 rfidA(SS_A, RST_PIN);
MFRC522 rfidB(SS_B, RST_PIN);
LiquidCrystal_I2C lcdA(0x27, 16, 2);
LiquidCrystal_I2C lcdB(0x26, 16, 2);

const int btnA[5] = {32, 33, 25, 14, 16}; 
const int btnB[5] = {13, 17, 36, 35, 34};  

/* ---------------- DATA STRUCTURES ---------------- */
struct ConsumeEvent { String uid; String mess; String meal; };
struct FeedbackEvent { String uid; String mess; String meal; int rating; };

std::vector<ConsumeEvent> consumeQueue;
std::vector<FeedbackEvent> feedbackQueue;

struct MealLists {
  std::vector<String> breakfast, lunch, snacks, dinner;
  std::vector<String> localConsumed; 
};
MealLists messA_lists;
MealLists messB_lists;

enum MessState { IDLE, SHOWING_MSG, AWAITING_RATING };

struct MessController {
  String name;
  MFRC522* rfid;
  LiquidCrystal_I2C* lcd;
  int buzzPin;
  const int* btns;
  MealLists* lists;
  MessState state;
  unsigned long stateTimer;
  String currentUID;
  String currentMeal;
  String lastIdleMeal; 
};

MessController ctrlA = {"Mess_A", &rfidA, &lcdA, BUZZ_A, btnA, &messA_lists, IDLE, 0, "", "", ""};
MessController ctrlB = {"Mess_B", &rfidB, &lcdB, BUZZ_B, btnB, &messB_lists, IDLE, 0, "", "", ""};

unsigned long demoStartTime = 0;
unsigned long lastTapTimeA = 0; 
unsigned long lastTapTimeB = 0;
unsigned long wifiDisconnectTime = 0;
bool wasWiFiConnected = false;

/* ---------------- HELPERS ---------------- */
void buzz(int pin, int duration, int times = 1) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH); delay(duration); digitalWrite(pin, LOW);
    if (times > 1) delay(100);
  }
}

String detectMeal() {
  unsigned long elapsed = (millis() - demoStartTime) / 1000;
  int cycle = elapsed % 1260; // 21-min cycle
  if (cycle < 240) return "breakfast";
  if (cycle < 300) return "break";
  if (cycle < 540) return "lunch";
  if (cycle < 600) return "break";
  if (cycle < 840) return "snacks";
  if (cycle < 900) return "break";
  if (cycle < 1140) return "dinner";
  return "break";
}

void showMessage(MessController &ctrl, String line1, String line2, int displayTimeMs) {
  ctrl.lcd->clear();
  ctrl.lcd->setCursor(0, 0); ctrl.lcd->print(line1);
  ctrl.lcd->setCursor(0, 1); ctrl.lcd->print(line2);
  ctrl.stateTimer = millis() + displayTimeMs; 
  ctrl.state = SHOWING_MSG;
  ctrl.lastIdleMeal = ""; 
}

void updateIdleLCD(MessController &ctrl) {
  String meal = detectMeal();
  if (ctrl.lastIdleMeal == meal) return; 

  ctrl.lcd->clear();
  ctrl.lcd->setCursor(0, 0); 
  ctrl.lcd->print(ctrl.name + (WiFi.status() == WL_CONNECTED ? " [ON]" : " [OFF]"));
  
  ctrl.lcd->setCursor(0, 1);
  if (meal == "break") {
    ctrl.lcd->print("Status: Break");
  } else {
    String capMeal = meal; capMeal[0] = toupper(capMeal[0]);
    ctrl.lcd->print("Active: " + capMeal);
  }
  ctrl.lastIdleMeal = meal;
}

/* ---------------- PERSISTENCE ---------------- */
void saveQueuesToFS() {
  DynamicJsonDocument doc(16384); 
  
  JsonArray cArr = doc.createNestedArray("consume");
  for (auto &e : consumeQueue) {
    JsonObject obj = cArr.createNestedObject();
    obj["u"] = e.uid; obj["ms"] = e.mess; obj["ml"] = e.meal;
  }
  
  JsonArray fArr = doc.createNestedArray("feedback");
  for (auto &e : feedbackQueue) {
    JsonObject obj = fArr.createNestedObject();
    obj["u"] = e.uid; obj["ms"] = e.mess; obj["ml"] = e.meal; obj["r"] = e.rating;
  }
  
  JsonArray lc_A = doc.createNestedArray("lcA");
  for (String &s : ctrlA.lists->localConsumed) lc_A.add(s);

  JsonArray lc_B = doc.createNestedArray("lcB");
  for (String &s : ctrlB.lists->localConsumed) lc_B.add(s);

  File f = LittleFS.open("/queues.json", "w");
  if (serializeJson(doc, f) == 0) Serial.println("[FS] ERROR: Save Failed!");
  f.close();
}

void loadQueuesFromFS() {
  if (!LittleFS.exists("/queues.json")) return;
  File f = LittleFS.open("/queues.json", "r");
  DynamicJsonDocument doc(16384);
  DeserializationError err = deserializeJson(doc, f);
  f.close();

  if (err) return;

  consumeQueue.clear(); feedbackQueue.clear(); 
  ctrlA.lists->localConsumed.clear(); ctrlB.lists->localConsumed.clear();

  for (JsonObject obj : doc["consume"].as<JsonArray>()) 
    consumeQueue.push_back({obj["u"].as<String>(), obj["ms"].as<String>(), obj["ml"].as<String>()});
  for (JsonObject obj : doc["feedback"].as<JsonArray>()) 
    feedbackQueue.push_back({obj["u"].as<String>(), obj["ms"].as<String>(), obj["ml"].as<String>(), obj["r"].as<int>()});
  for (String s : doc["lcA"].as<JsonArray>()) ctrlA.lists->localConsumed.push_back(s);
  for (String s : doc["lcB"].as<JsonArray>()) ctrlB.lists->localConsumed.push_back(s);
  Serial.println("[FS] State Restored.");
}

/* ---------------- API ---------------- */
void downloadList(String mess, String meal, std::vector<String> &list) {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String url = SERVER + "/sync/" + mess + "/" + meal;
  http.begin(url);
  if (http.GET() == 200) {
    DynamicJsonDocument doc(8192);
    deserializeJson(doc, http.getString());
    list.clear();
    for (JsonVariant v : doc["rfids"].as<JsonArray>()) list.push_back(v.as<String>());
    Serial.printf("[SYNC] %s - %s: Loaded %d RFIDs\n", mess.c_str(), meal.c_str(), list.size());
  }
  http.end();
}

void syncAllLists() {
  if (WiFi.status() != WL_CONNECTED) return;
  downloadList("Mess_A", "breakfast", messA_lists.breakfast);
  downloadList("Mess_A", "lunch", messA_lists.lunch);
  downloadList("Mess_A", "snacks", messA_lists.snacks);
  downloadList("Mess_A", "dinner", messA_lists.dinner);
  downloadList("Mess_B", "breakfast", messB_lists.breakfast);
  downloadList("Mess_B", "lunch", messB_lists.lunch);
  downloadList("Mess_B", "snacks", messB_lists.snacks);
  downloadList("Mess_B", "dinner", messB_lists.dinner);
}

void pushOfflineData() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  bool changed = false;
  
  for (auto it = consumeQueue.begin(); it != consumeQueue.end(); ) {
    http.begin(SERVER + "/consume");
    http.addHeader("Content-Type", "application/json");
    String body = "{\"rfid_uid\":\"" + it->uid + "\",\"mess_name\":\"" + it->mess + "\",\"meal_type\":\"" + it->meal + "\"}";
    int code = http.POST(body);
    if (code == 200 || code == 400 || code == 403) { it = consumeQueue.erase(it); changed = true; }
    else ++it;
    http.end();
  }

  for (auto it = feedbackQueue.begin(); it != feedbackQueue.end(); ) {
    http.begin(SERVER + "/feedback");
    http.addHeader("Content-Type", "application/json");
    String body = "{\"rfid_uid\":\"" + it->uid + "\",\"mess_name\":\"" + it->mess + "\",\"meal_type\":\"" + it->meal + "\",\"rating\":" + String(it->rating) + "}";
    int code = http.POST(body);
    if (code == 200 || code == 400 || code == 403) { it = feedbackQueue.erase(it); changed = true; }
    else ++it;
    http.end();
  }
  if (changed) saveQueuesToFS(); 
}

/* ---------------- MAIN LOGIC ---------------- */
void processMess(MessController &ctrl, unsigned long &lastTapTime) {
  unsigned long currentMillis = millis();

  if (ctrl.state == SHOWING_MSG) {
    if (currentMillis > ctrl.stateTimer) { ctrl.state = IDLE; updateIdleLCD(ctrl); }
    return;
  }

  if (ctrl.state == AWAITING_RATING) {
    for (int i = 0; i < 5; i++) {
      if (digitalRead(ctrl.btns[i]) == LOW) {
        feedbackQueue.push_back({ctrl.currentUID, ctrl.name, ctrl.currentMeal, i + 1});
        
        // CRITICAL FIX 1: Remove from localConsumed after rating to prevent infinite loops
        auto it = std::find(ctrl.lists->localConsumed.begin(), ctrl.lists->localConsumed.end(), ctrl.currentUID + ctrl.currentMeal);
        if (it != ctrl.lists->localConsumed.end()) ctrl.lists->localConsumed.erase(it);

        saveQueuesToFS();
        buzz(ctrl.buzzPin, 100);
        
        String capMeal = ctrl.currentMeal; capMeal[0] = toupper(capMeal[0]);
        showMessage(ctrl, capMeal + " Rated!", String(i + 1) + " Stars Saved", 2500);
        pushOfflineData(); 
        return;
      }
    }
    // Auto-timeout also clears localConsumed to reset student status
    if (currentMillis > ctrl.stateTimer) {
      auto it = std::find(ctrl.lists->localConsumed.begin(), ctrl.lists->localConsumed.end(), ctrl.currentUID + ctrl.currentMeal);
      if (it != ctrl.lists->localConsumed.end()) ctrl.lists->localConsumed.erase(it);
      ctrl.state = IDLE; updateIdleLCD(ctrl);
    }
    return;
  }

  if (ctrl.state == IDLE) {
    updateIdleLCD(ctrl); 
    if (!ctrl.rfid->PICC_IsNewCardPresent() || !ctrl.rfid->PICC_ReadCardSerial()) return;
    if (currentMillis - lastTapTime < 2500) { ctrl.rfid->PICC_HaltA(); return; } 
    lastTapTime = currentMillis;

    String uid = "";
    for (byte i = 0; i < ctrl.rfid->uid.size; i++) { uid += String(ctrl.rfid->uid.uidByte[i], HEX); }
    uid.toUpperCase();
    ctrl.rfid->PICC_HaltA();
    
    if (uid == ADMIN_UID) {
      buzz(ctrl.buzzPin, 150, 2);
      showMessage(ctrl, "Admin Mode", "Refreshing...", 3000);
      pushOfflineData(); syncAllLists(); return;
    }

    String meal = detectMeal();
    if (meal == "break") {
      buzz(ctrl.buzzPin, 500);
      showMessage(ctrl, "Break Time", "No Meals Now", 2500);
      return;
    }

    // CHECK 1: TAP 2 (EXIT/RATING)
    auto itCons = std::find(ctrl.lists->localConsumed.begin(), ctrl.lists->localConsumed.end(), uid + meal);
    if (itCons != ctrl.lists->localConsumed.end()) {
      buzz(ctrl.buzzPin, 100);
      ctrl.currentUID = uid; ctrl.currentMeal = meal;
      String capMeal = meal; capMeal[0] = toupper(capMeal[0]);
      ctrl.lcd->clear(); ctrl.lcd->setCursor(0, 0); ctrl.lcd->print("Rate " + capMeal + ":");
      ctrl.lcd->setCursor(0, 1); ctrl.lcd->print("Buttons 1-5*");
      ctrl.stateTimer = currentMillis + 5000;
      ctrl.state = AWAITING_RATING;
      return;
    }

    // CHECK 2: TAP 1 (ENTRY)
    std::vector<String>* myBooked;
    if (meal == "breakfast") myBooked = &ctrl.lists->breakfast;
    else if (meal == "lunch") myBooked = &ctrl.lists->lunch;
    else if (meal == "snacks") myBooked = &ctrl.lists->snacks;
    else myBooked = &ctrl.lists->dinner;

    auto itMyBooked = std::find(myBooked->begin(), myBooked->end(), uid);

    if (itMyBooked != myBooked->end()) {
      ctrl.lists->localConsumed.push_back(uid + meal);
      myBooked->erase(itMyBooked); 
      consumeQueue.push_back({uid, ctrl.name, meal});
      saveQueuesToFS();
      pushOfflineData(); 
      buzz(ctrl.buzzPin, 400); 
      String capMeal = meal; capMeal[0] = toupper(capMeal[0]);
      showMessage(ctrl, "Access Granted", capMeal + " Verified", 2500);
    } 
    else {
      // CROSS-CHECK OTHER MESS
      MealLists* other = (ctrl.name == "Mess_A") ? &messB_lists : &messA_lists;
      std::vector<String>* otherList;
      if (meal == "breakfast") otherList = &other->breakfast;
      else if (meal == "lunch") otherList = &other->lunch;
      else if (meal == "snacks") otherList = &other->snacks;
      else otherList = &other->dinner;

      if (std::find(otherList->begin(), otherList->end(), uid) != otherList->end()) {
        buzz(ctrl.buzzPin, 100, 3);
        String otherName = (ctrl.name == "Mess_A") ? "Mess B" : "Mess A";
        showMessage(ctrl, "Wrong Mess!", "Go to " + otherName, 3500);
      } else {
        buzz(ctrl.buzzPin, 100, 3);
        showMessage(ctrl, "Denied", "No Booked " + meal, 2500);
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  LittleFS.begin(true);
  loadQueuesFromFS();
  SPI.begin();
  rfidA.PCD_Init(); rfidB.PCD_Init();
  pinMode(BUZZ_A, OUTPUT); pinMode(BUZZ_B, OUTPUT);
  for (int i = 0; i < 5; i++) {
    pinMode(btnA[i], INPUT_PULLUP);
    pinMode(btnB[i], (btnB[i] >= 34 && btnB[i] <= 39) ? INPUT : INPUT_PULLUP); 
  }
  Wire.begin(); 
  lcdA.init(); lcdA.backlight(); lcdB.init(); lcdB.backlight();
  WiFi.begin(ssid, password);
  int connectWait = 0;
  while (WiFi.status() != WL_CONNECTED && connectWait < 20) { delay(500); connectWait++; }
  if (WiFi.status() == WL_CONNECTED) { wasWiFiConnected = true; pushOfflineData(); syncAllLists(); }
  demoStartTime = millis();
}

void loop() {
  unsigned long currentMillis = millis();
  if (WiFi.status() != WL_CONNECTED) {
    if (wasWiFiConnected) { wasWiFiConnected = false; wifiDisconnectTime = currentMillis; }
    if (currentMillis - wifiDisconnectTime >= 180000) { WiFi.disconnect(); WiFi.begin(ssid, password); wifiDisconnectTime = currentMillis; }
  } else if (!wasWiFiConnected) { wasWiFiConnected = true; pushOfflineData(); syncAllLists(); }
  processMess(ctrlA, lastTapTimeA);
  processMess(ctrlB, lastTapTimeB);
}