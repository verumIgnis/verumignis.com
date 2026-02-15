# TNAK Script
TNAK Script is a minimal implementation of DuckyScript.

**IMPORTANT** This editor will NOT save your work! Always remember to save your script to a text file before closing this page or reading from your device.

---

### REM
REM is a remark (a comment). Anything after REM will be ignored.

Example:
```
REM This will be ignored by TNAK
STRING But this will be typed
```

---

### STRING
TNAK will type the text in the string.

Example:
```
REM Type the link to this page then press enter
STRING https://verumignis.com/tnak
ENTER
```

---

### DELAY
TNAK will wait the specified time in miliseconds.

Example:
```
REM Open the calculator
GUI r
REM Wait for 0.5s
DELAY 500
STRING calculator.exe
ENTER
```

---

### SPEED
The amount of time between each keypress in miliseconds.

Example:
```
SPEED 1
STRING This is typed very fast!
SPEED 500
STRING And this is typed very slow...
```

---

### HOLD & RELEASE
TNAK will HOLD the specified key down until RELEASEd.

Example:
```
HOLD CTRL
STRING c
DELAY 1000
STRING v
RELEASE CTRL
```