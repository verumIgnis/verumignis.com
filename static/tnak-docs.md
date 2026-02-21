# Totally Not A Keyboard (TNAK)
TNAK is a USB stick that pretends to be a keyboard.

You can download the EDA files **[here](/TNAK.zip)** (Designed with KiCAD 9).

I would suggest JLCPCB or PCBWay for ordering the PCBs because they are cheap and have a minimum order quantity of 5. Both also offer PCB assembly if you arent set up for microsoldering.

BOM CSV:
```
Part,Quantity,DigiKey P/N,LCSC P/N
22R 1608 (Metric) Chip Resistor,2,311-22.0HRCT-ND,C107701
4.7uF 1608 (Metric) Ceramic Capacitor,2,1276-1044-1-ND,C1705
STM32F042F6P6 Microcontroller,1,497-19656-1-ND,C2969989
HT7333-A LDO Regulator,1,4518-HT7333-ACT-ND,C347191
```

If ordering from LCSC total cost is under £2 per board

---

# TNAK Script
TNAK Script is somewhat similar to DuckyScript.

**IMPORTANT** This editor will NOT save your work! Always remember to save your script to a text file before closing this page.

Remember that TNAK will start typing as soon as programming has finished. Be ready to unplug it!

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

Modifier keys are applied automatically.

Example:
```
REM Type the link to this page then press enter
STRING https://verumignis.com/tnak
ENTER
```

---

### Single Keys
Any line that does not start with a command is considered a single key. TNAK will type the key once.

This will not automatically apply any modifier keys, for example **A** will be typed as **a** unless **SHIFT** is held.

Example:
```
GUI
DELAY 250
K
i
C
A
D
DELAY 250
ENTER
```

---

### DELAY
TNAK will wait the specified time in miliseconds.

Maximum value is 65535.

Example:
```
REM Open the calculator
HOLD GUI
R
RELEASE GUI

REM Wait for 0.5s
DELAY 500

STRING calculator.exe
ENTER
```

---

### SPEED
The amount of time between each update in miliseconds.

A keypress is 2 updates, 1 down + 1 up.

This is quite inacccurate as the host might take a variable amount of time to interpret each update (+-10ms).

This is 20ms by default. Going lower than this may result in keypresses being missed.

Maximum value is 65535.

Example:
```
SPEED 15
STRING This is typed very fast!
SPEED 250
STRING And this is typed very slow...
```

---

### HOLD & RELEASE
TNAK will HOLD the specified key down until RELEASEd.

A maximum of 5 normal keys plus all modifiers can be held at once.

STRING will override a held SHIFT.

Example:
```
HOLD CTRL
C
DELAY 2000
V
RELEASE CTRL
```