### **USB Rubber Duckys are too expensive, so I made something cheaper.**

![Photo of a TNAK plugged into a USB port](/tnak-v2.png)

TNAK emulates a keyboard and types whatever you program onto it. 

This post is a guide for how to make your own.

---

# PCBs

You can download the EDA files [here](/TNAK-PCB.zip) (Designed with KiCAD 9).

![Assembly order](/tnak-layout.png)

I would suggest JLCPCB or PCBWay for ordering the PCBs because they are cheap and have a minimum order quantity of 5. Both also offer PCB assembly if you aren't set up for microsoldering.

---

# Components

The components used in TNAK are easily available from many sources, I would recommend LCSC (cheaper) or Digikey.

BOM CSV:
```
Part,Quantity,DigiKey P/N,LCSC P/N
22R 1608 (Metric) Chip Resistor,2,311-22.0HRCT-ND,C107701
4.7uF 1608 (Metric) Ceramic Capacitor,2,1276-1044-1-ND,C1705
STM32F042F6P6 Microcontroller,1,497-19656-1-ND,C2969989
HT7333-A LDO Regulator,1,4518-HT7333-ACT-ND,C347191
```

If ordering from LCSC and JLCPCB the total cost is under £2 per board.

---

# Assembly

You do not need hot air to assemble these boards, I assembled mine using just a soldering iron with a C210-K tip.

Assemble the boards in this order:

1. Apply flux to all pads, then tin the pads for the passives.
2. For each passive, use a knife tip to heat both sides of the component and the pad, hold the component in place with tweezers and remove the iron, then remove your tweezers. With enough flux, the component will be pulled into place by surface tension.
3. Place the regulator on the board and apply solder to each pin, make sure to heat the middle pin long enough for solder to flow all the way under.
4. Place the STM32 on the board, make sure it is lined up perfectly and in the correct orientation (the divot on the chip should line up with the arrow on the board) then solder one corner pin, then press down on the chip and solder the opposite corner. If you are happy with the alignment, solder each pin with the tip of your iron, drag soldering wont work and will result in bridging the pins. If you bridge any pins, wick up the solder and try again.
5. Tin the USB pads, otherwise the TNAK will not hold securely in a USB port.
6. Measure continuity between each pin on the regulator to ensure there are no shorts under the regulator.
7. Connect your TNAK, a brand new blank STM32 will show up as STM32 BOOTLOADER and is ready to be flashed.

![Assembly order](/assembly-order.png)

---

# Programming

To program your TNAK for the first time, plug it in and go to [https://verumignis.com/tnak](https://verumignis.com/tnak). The first time you power it on you do not need to short PROG to 3.3V. Select "Write Script To TNAK" then select "STM32 BOOTLOADER" in the WebUSB popup. 

TNAK will start typing 1 second after its finished programming, so if you don’t want it to type the payload, be ready to unplug it!

To reprogram an already programmed TNAK, use some wire or a pair of tweezers to short PROG to 3.3V as indicated on the silkscreen while plugging it in. Be careful not to short anything else on the board.

![Shorting PROG to 3.3V using tweezers](/prog-short.png)

Please read the documentation in the TNAK editor for TNAK script syntax.

It is strongly recommended to use GNU/Linux or Android to flash TNAK, they are tested to work reliably.

You must use a browser based on Chromium (Chrome, Ungoogled Chromium, Edge, Brave, etc...) to Flash TNAK. Firefox, Safari, IE and any other browsers not based on chromium will not work because they do not support WebUSB.

Windows is known to be problematic with WebUSB, this is the fault of Windows, not TNAK or your web browser. Windows will completely fail to recognise any device it doesn’t have a driver loaded for. A potential workaround for this could be to install STM32Cube Programmer as this comes with a Windows driver for STM32 BOOTLOADER. **If you ignore my advice and decide to program TNAK using Windows anyway, figure it out on your own, please don’t contact me for Windows tech support.**

TNAK works perfectly as a keyboard on Windows, GNU/Linux, MacOS, Android and all other platforms that support USB keyboards. It will appear as a Dell KB216 wired keyboard (very generic office keyboard) to the operating system it is connected to.

---

# Usage

Now for the fun part! Plug it into a computer and it will start typing whatever you programmed it to type. Below are some examples of what it can do:

**Open the TNAK editor website then flash itself:**
```
REM Open this website and clear the text field, assumes it starts with a address bar selected:
STRING https://verumignis.com/tnak
HOLD CTRL
A
C
RELEASE CTRL
ENTER
DELAY 1000
TAB
HOLD CTRL
A
BACKSPACE
RELEASE CTRL
REM Recursive TNAK script:
STRING STRING https://verumignis.com/tnak
ENTER
STRING HOLD CTRL
ENTER
STRING A
ENTER
STRING C
ENTER
STRING RELEASE CTRL
ENTER
STRING ENTER
ENTER
STRING DELAY 1000
ENTER
STRING TAB
ENTER
STRING HOLD CTRL
ENTER
STRING A
ENTER
STRING BACKSPACE
ENTER
STRING RELEASE CTRL
TAB
ENTER
```

**Open the terminal on a GNU/Linux system and run a forkbomb:**
```
GUI
DELAY 250
STRING Terminal
DELAY 250
ENTER
DELAY 1000
STRING :(){:|:&};:
ENTER
```

**Open the windows calculator:**
```
REM Open the calculator
HOLD GUI
R
RELEASE GUI
REM Wait for 0.5s for the run prompt to open
DELAY 500
STRING calculator.exe
ENTER
```

**Cheating at a typing test:**

![Cheating at a typing test](/cheating.png)

![Certificate of typing proficiency](/tnak-certificate.png)

---

# How It Works & Limitations

The hardware is very simple, the STM32 is powered from the USB connector through a 5V -> 3.3V regulator. There are 2 capacitors and 2 resistors to improve the device's stability. This design reduces cost by using a edge connector for USB and 2 plated holes instead of a button for programming. The board also exposes the STM32's SWD interface.

The TNAK does not implement all the functionality of the USB Rubber Ducky such as OS detection and full DuckyScript. The goal of this project is to make a device that costs as little as possible while still implementing enough functionality for the majority of use cases.

The STM32F042F6P6 has 32KB flash, the lower 16KB is used to store the firmware while the upper 16KB is used for storing the payload. The website downloads the firmware and places it in the lower 16KB, then parses the script and generates the payload data for the upper 16KB, then writes both to the chip. Since both are always written at the same time, this ensures the firmware version always matches the data format version, it also means it's almost impossible to brick a TNAK.

The 16KB payload space does limit the size of the payload, but in reality it would take so long to type 16KB worth of data that this limit is rarely reached in practice.

