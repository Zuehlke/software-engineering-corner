---
title: Digital Twins .. or why doing things twice is sometimes more efficient
domain: software-engineering-corner.hashnode.dev
tags: agile development, programming languages, hardware, best practices
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1747223913763/rWSPApSkf.avi?auto=format
publishAs: sernst-zch
saveAsDraft: true
hideFromHashnodeCommunity: false
enableToc: true
---

## Reduce risks and fail faster in the FPGA / hardware waterfall world

Hardware engineers as well as FPGA[<sup>1</sup>](#glossary) engineers have the reputation of not fitting well into agile development sprints.
How should one create a PCB[<sup>2</sup>](#glossary) within a week?
Siimilarely for FPGA engineering, we sometimes have longer to work for a shippable increment.
Coding VHDL or Verilog is bit-banging, both are hardware description languages, there is barely any abstraction from the language provided and basically reduced to connecting wires to flip-flops.
In contradiction, the thing that everyone wants to know before the project even starts, is:
"How many FPGA ressources will we need and how expensive is the device going to be?".
I can't tell. I don't even know if the paper-concept, that we created at the kick-off, works in real life.
It's like building a medieval castle with only stones and mortar and no exact building plan.
You only know once the project is finished, how long it took and how many stones were needed... and if it was feasible at all.

### How to actually build a medieval castle?

Imagine you're the builder and being contracted by noble people.
They want a castle.
Out of solid stone.
It shall be big, they have five horses, and they are 7 people.
<br><br>
*"Be quicketh or Thy head shall tumble"* and the deal was made.
<br><br>
Well, how do you proceed?
Waterfall methology states, that we build first, then verify and test.
So, you begin carving stones.  
You carve and carve, carry the finished blocks over long distances from the quarry to the site, put one on top of another, build walls, roofs and polish the door handles.
Finally, after a year or three, the castle is finished.
It looks just like the one on the painting you showed them in the beginning, from the outside that is.
The first time you walk through with the noble people, they say; "Yeah, nice and all, but where is the entry for the horses?
The horses?
They will go into the stable in the backyard, we'll build a nice shelt... THE BACKYARD?!
No, no, no the horses should have been *inside* the castle! We don't want to leave them unprotected outside! It's a castle after all! And where do our 14 servants live? We obviously don't need to mention, that we don't take care of the horses by ourselves.

oh boy.. Good thing we have python nowadays!

### a more recent example: ICU patient supervision

Usually, at Zuehlke, we don't build stone castles.
Rather, as a fictional example, a new device for the remote supervision of ICU[<sup>3</sup>](#glossary) patients in a hospital.
The device shall have an FPGA on it, acting as sensor fusion building block and network preprocessor as a first line of defence to increase the reliability and attack resilience of the system.
The surveillance application on the main processor-module shall only receive UDP[<sup>4</sup>](#glossary) frames which are sent to a specific destination port.

### the same game

We could now start the same way as our poor friends a thousand years ago did.
We would start up our VHDL code machines, carve lines after lines, create a super solid foundation to receive ethernet frames, have the PLLs[<sup>5</sup>](#glossary) lock and the data passing through the device with line speed and no bit-errors.
This is a time consuming tasks, as everything has to be aligned with the hardware already and the hardware specific properties of the target environment resp. the evaluation board.
Three weeks in the project and the led is blinking on the evaluation board, and the VHDL testbench features a few testcases to prove the UDP filter works.
So far so good.
Now, while trying to test the device with our noble customers, we find out that not only IPv4 but also IPv6 shall be supported.
Additionally, as soon as we hooked up our prototype to the test network in the hospital for the first field tests, random ARP frames would pass the filter unharmed, as the payload data by coincidence matches the destination port comparison.
Turns out, we shouldn't just compare the UDP destination port word.
Things that we just didn't think about in the beginning or during development.

## A better way: building a digital twin first

How can be avoid those risks?
Far before we load the first limestone to our carriage and far before we hook up our device first time to the customers network, we could create a digital model of what we plan to do.
The huge python ecosystem can abstract all the foundation and swamp problems, additionally, a simple network capture or even synthetically generated data replaces the first walkthrough test with our noblemen.
I think you start to get the concept. We are turning the waterfall upside down.
Test-driven design shapes our implementation and from there we observe very quickly how the device acts in real life against our concept / requirements.
And because we now use python, we are much faster in adapting our implementation.
Python is a high-level language and it's ecosystem makes it very convenient to "just hack something". Not even mentioning AI GPT's that fluently speak Python but rarely VHDL.
The digital twin can be seen as a "dry-run" before we actually start carving out lines of VHDL.

### Walkthrough

Enough theory and funny words, let's walk through from A-Z for our patient supervision case.
The filter we want to design, shall only pass valid UDP frames with a specific destination port.

Instead of building the filter right away, let us start to create a testbench and generate (synthetic) data first:

```python
from scapy.all import *
from scapy.layers.l2 import *
from scapy.layers.inet import *
from scapy.layers.inet6 import *

import udp_port_filter

valid_dst_port = 1234

packet_list = []

# define how many packets each we want to simulate
sample_size = 100

# [BAD]: ARP
packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/ARP())

# [BAD]: IPv4, no UDP, random payload (and -length)
packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IP(src="192.168.1.10", dst="192.168.1.15", proto=0x92 )/raw(random.randbytes(random.randint(0, 1400))))

# [BAD]: IPv6 with no UDP
packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IPv6(src="fe80::10", dst="fe80::15", nh=0x3B)/raw(random.randbytes(random.randint(0, 1400))))

# IPv4 with random destination port, random payload (and -length). Destination port is not the one we want, all should be dropped
while len(packet_list) < sample_size+3:
    dport = random.randint(0, 65535)
    if dport != tb.dut.valid_udp_dst_port:
        packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IPv6(src="fe80::10", dst="fe80::15")/UDP(sport=random.randint(1,65535), dport=dport)/raw(random.randbytes(random.randint(0, 1400))))

# append one good one
packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IPv6(src="fe80::10", dst="fe80::15")/UDP(sport=random.randint(1,65535), dport=1234)/raw(random.randbytes(random.randint(0, 1400))))

# IPv6 with all ports, random payload (and -length). Destination port is not the one we want, all should be dropped
while len(packet_list) < sample_size*2+4:
    dport = random.randint(0, 65535)
    if dport != tb.dut.valid_udp_dst_port:
        packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IP(src="192.168.1.10", dst="192.168.1.15")/UDP(sport=random.randint(1,65535), dport=dport)/raw(random.randbytes(random.randint(0, 1400))))

# append one good one
packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IP(src="192.168.1.10", dst="192.168.1.15")/UDP(sport=random.randint(1,65535), dport=1234)/raw(random.randbytes(random.randint(0, 1400))))


# save stimuli to file
wrpcap("./test_input.pcap", packet_list, linktype=1)
```

With [scapy](https://scapy.net/), we can craft new headers like `Ether(dst, src, type)` or `IP(src, dst, ...)` and concatinate them with the division operator `Ether()/IP()`.
The `raw` header lets us append or inject any length of bytes to our desire.
Scapy's utils package provides us with `wrpcap()`. This function takes a list of packets and writes them to a PCAP file, which you can open with wireshark.
Similarly, `rdpcap()` will read those packets back into scapys packetList format.
The file `test_input.pcap` will now have around 200 packets, which we use as testdata for our filter. The good thing is, this testbench can later be reused together with [cocoTb](https://www.cocotb.org/) to run VHDL code next to it and compare the output with our golden device, the python implementation.
<br><br>
Important when designing a digital twin for an FPGA is now, that we make use of the python ecosystem, but won't take too many shortcuts.
We want to keep the FPGA ressources and capabilites in mind.
A simple one-liner in python might do the trick as well, but we wouldn't get any insights of the ressources needed in VHDL for this.

First, let's define a function prototype that takes an input file path, an output file path for frames that shall be forwarded (pass the filter) and one for frames that are dropped by the filter (rejected by the filter).
Additionally, we need the valid destination port number to compare the UDP header to.

```python
from scapy.all import *
from scapy.layers.l2 import *
from scapy.layers.inet import *
from scapy.layers.inet6 import *

def process(input_file, output_file_forward, output_file_drop, valid_dst_port):
```

The next snippet abstracts now the whole Ethernet subsystem with MAC and PLLs etc. With `rdpcap` we can load the testdata previously generated in PCAP format.
Additionally, we initialize our output lists to later fill them with data.

```python
input_frame_list = rdpcap(input_file)
output_frame_list = []
dropped_frame_list = []
```

Then comes the filter itself.
Again, we could have made this simpler.
Intentionally, we do this step by step as in the final VHDL implementation, we probably want to use registers, FIFOs and or a pipeline for this.

```python
# process all the frames
for input_frame in input_frame_list:
    # is it an Ethernet frame?
    if Ether in input_frame:
        # is it an IP frame?
        if IP in input_frame or IPv6 in input_frame:
            # is the IP protocol UDP?
            if UDP in input_frame:
                if input_frame[UDP].dport == valid_dst_port:
                    output_frame_list.append(input_frame)
                else:
                    dropped_frame_list.append(input_frame)
            # not UDP
            else:
                dropped_frame_list.append(input_frame)
        # not IP/IPv6
        else:   
            dropped_frame_list.append(input_frame)

    # not Ethernet
    else:
        dropped_frame_list.append(input_frame)
```

The last stage consists of writing the results back into pcap files for us humans to understand and visually verify what happened.

```python
# write results
print(f"Pass: {len(output_frame_list)} frames")
wrpcap(output_file_forward, output_frame_list, linktype=DLT_EN10MB)

print(f"Drop: {len(dropped_frame_list)} frames")
wrpcap(output_file_drop, dropped_frame_list, linktype=DLT_EN10MB)
```

That's it.

running the testbench with our filter at the end will give the following result:

```bash
python .\tb_udp_port_filter.py
Pass: 2 frames
Drop: 203 frames
```

With less than 100 lines of code, we built a complete virtual twin with testbench.
Instead of generating our testdata from within the testbench, we could feed it with real world captured data using utilities like tcpdump or specialized hardware.

### Reusing the python testbench with cocoTb

Once we validated, that the virtual twin does, what we want, we can craft our VHDL code.
The benefit is, we exactly know what we need to do and how input, intermediate results and output shall look like.
As mentioned above, to test the finished VHDL implementation, we can reuse our digital twin testbench.
cocotb has a few examples in their github repository under https://github.com/cocotb/cocotb/tree/master/examples.

All of them have a `cocotb.test()` routine, which is executed either by the framework on Makefile based testbenches or via runner on runner based testbenches (https://docs.cocotb.org/en/stable/runner.html).
The example below is a Makefile based testbench.
Two elements are present.

- a class `TB` which connects the VHDL source to the testbench (`dut` is an object provided by the framework)
- one or multiple `async def test_xyz(dut)` functions, which contain the actual testbench sequence

In this example, we have one test defined and several helper routines that run in parallel (async).
One is to send data over AXI-Stream and the other is to receive data over AXI-Stream and compare it to the expected result.
Both are launched via `cocotb.start_soon()`.
The expected result itself is generated inside the `test_passthrough()` function on the line:  
`udp_port_filter.process("./test_input.pcap", "./test_output_forward.pcap", "./test_output_drop.pcap", tb.dut.valid_udp_dst_port)`

This is the same line as we used before in our digital twin to call the python version of our code.
Running this (with the right Makefile and a VHDL implementation of the udp filter) will result in something like this:

```text
#      0.00ns INFO     cocotb                             Running on ModelSim for Questa-64 version 2025.1 2025.04
..
#      0.00ns INFO     cocotb.regression                  Found test tb_udp_port_filter.test_passthrough
#      0.00ns INFO     cocotb.regression                  running test_passthrough (1/1)
..
#      0.00ns INFO     cocotb.udp_port_filter.m_axis      Reset de-asserted
#      0.00ns INFO     cocotb.tb                          Starting test
# Pass: 2 frames
# Drop: 203 frames
#   2110.00ns INFO     cocotb.tb                          expecting 2 frames
#   2110.00ns INFO     cocotb.tb                          Sending 42 bytes
...
# 3104480.00ns INFO     cocotb.tb                          Sending 533 bytes
# 3123390.00ns INFO     cocotb.tb                          Received 533 bytes
# 3123400.00ns INFO     cocotb.tb                          captured 2 packets
# 3129060.00ns INFO     cocotb.regression                  test_passthrough passed
# 3129060.00ns INFO     cocotb.regression                  *********************************************************************************************
#                                                          ** TEST                                 STATUS  SIM TIME (ns)  REAL TIME (s)  RATIO (ns/s) **
#                                                          *********************************************************************************************
#                                                          ** tb_udp_port_filter.test_passthrough   PASS     3129060.00          24.03     130236.29  **
#                                                          *********************************************************************************************
#                                                          ** TESTS=1 PASS=1 FAIL=0 SKIP=0                   3129060.00          24.36     128434.34  **
#                                                          *********************************************************************************************
```

Here is the full code of the cocotb testbench: 

```python
# Testbench for udp_port_filter for cocotb.
# Testbench will setup simulation and then generate testdata and expected results by using the python model udp_port_filter.py
# Data is sent via AXI-Stream, Results as well as input data are written to PCAP Files.

import logging

from scapy.all import *
from scapy.layers.l2 import *
from scapy.layers.inet import *
from scapy.layers.inet6 import *

import cocotb
from cocotb.clock import Clock
from cocotb.handle import *
from cocotb.triggers import *
from cocotbext.axi import AxiStreamBus, AxiStreamSource, AxiStreamSink

import udp_port_filter


class TB:
    def __init__(self, dut):
        
        self.log = logging.getLogger(f"cocotb.tb")

        # Connect the DUT
        self.dut = dut
        self.clk = dut.clk
        self.rstn = dut.resetn

        # Set the port we want to allow
        self.dut.valid_udp_dst_port.value = 1234

        # Create A clock
        cocotb.start_soon(Clock(self.clk, 10, units="ns").start())

        # Create and connect Source to DUT
        self.source = AxiStreamSource(bus=AxiStreamBus.from_prefix(dut, "s_axis"),clock=self.clk,reset=self.rstn, reset_active_level=False)
        self.source.log.setLevel(logging.WARNING)

        # Create and connect Sink to DUT
        self.sink = AxiStreamSink(bus=AxiStreamBus.from_prefix(dut, "m_axis"),clock=self.clk,reset=self.rstn, reset_active_level=False)
        self.sink.log.setLevel(logging.WARNING)

    async def init(self):
        # initialize 'mutex'
        self.testFinished = False

        # issue synchronous reset
        await RisingEdge(self.clk)
        self.rstn.value = 0
        for i in range(10):
            await RisingEdge(self.clk)
        self.rstn.value = 1
        await RisingEdge(self.clk)
        await Timer(2, units='us')
        await RisingEdge(self.clk)


async def checkTask(expected_data, tb):
    '''
    Asynchronous data verification to a defined list of packets

    Parameters
    ----------
    expected_data : list of bytearrays
       Each bytearray represents the expected data on the axi stream port
    tb : testbench object
       The testbench object to access members
    '''
    pcap_out = []
    total_errors = 0
    packet_number = 0
    
    tb.log.info(f"expecting {len(expected_data)} frames")
    while not tb.testFinished:
        
        # wait until tvalid is set
        await RisingEdge(tb.clk)
        if (tb.dut.m_axis_tvalid.value == 0):
            continue

        # receive frame
        rxframe = await tb.sink.recv()
        
        # add to output storage
        pcap_out.append(bytes(rxframe.tdata))
               
        # check if frame is in the list of expected frames
        if rxframe.tdata in expected_data:
            tb.log.info(f"Received %d bytes"%len(rxframe.tdata))
        else:
            tb.log.error(f"Received unexpected frame: %d bytes"%len(rxframe.tdata))
            # Debug print what we recieved
            print(Ether(rxframe.tdata).show2())
            total_errors += 1

        packet_number += 1
        await RisingEdge(tb.clk)
    
    tb.log.info(f"captured %d packets", packet_number)

    # write result to pcap file
    scapy.utils.wrpcap("./test_sim_output.pcap", pcap_out, linktype=1)

    assert total_errors == 0
    return


async def sendTask(stimuli_list, tb):
    '''
    Asynchronous data sender of a list of packets (bytearrays)

    Parameters
    ----------
    stimuli_list : list of bytearrays
       Each bytearray represents the data to be sent over the axi stream port
    tb : testbench object
       The testbench object to access members
    '''
    for packet in range(len(stimuli_list)):
        tb.log.info(f"Sending {len(stimuli_list[packet])} bytes")
        await tb.source.write(stimuli_list[packet])
        await tb.source.wait()
        await Timer(1, units='us')

    return


@cocotb.test()
async def test_passthrough(dut):

    # Create an instance of testbench
    tb = TB(dut)
    tb.log.info("Starting test")

    # initialize signals and reset
    await tb.init()

    packet_list = []
    stimuli_list = []
    result_list = []

    # define how many packets each we want to simulate
    sample_size = 100

    # [BAD]: ARP
    packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/ARP())

    # [BAD]: IPv4, no UDP, random payload (and -length)
    packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IP(src="192.168.1.10", dst="192.168.1.15", proto=0x92 )/raw(random.randbytes(random.randint(0, 1400))))

    # [BAD]: IPv6 with no UDP
    packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IPv6(src="fe80::10", dst="fe80::15", nh=0x3B)/raw(random.randbytes(random.randint(0, 1400))))

    # IPv4 with random destination port, random payload (and -length). Destination port is not the one we want, all should be dropped
    while len(packet_list) < sample_size+3:
        dport = random.randint(0, 65535)
        if dport != tb.dut.valid_udp_dst_port:
            packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IPv6(src="fe80::10", dst="fe80::15")/UDP(sport=random.randint(1,65535), dport=dport)/raw(random.randbytes(random.randint(0, 1400))))
    
    # append one good one
    packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IPv6(src="fe80::10", dst="fe80::15")/UDP(sport=random.randint(1,65535), dport=1234)/raw(random.randbytes(random.randint(0, 1400))))

    # IPv6 with all ports, random payload (and -length). Destination port is not the one we want, all should be dropped
    while len(packet_list) < sample_size*2+4:
        dport = random.randint(0, 65535)
        if dport != tb.dut.valid_udp_dst_port:
            packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IP(src="192.168.1.10", dst="192.168.1.15")/UDP(sport=random.randint(1,65535), dport=dport)/raw(random.randbytes(random.randint(0, 1400))))
    
    # append one good one
    packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IP(src="192.168.1.10", dst="192.168.1.15")/UDP(sport=random.randint(1,65535), dport=1234)/raw(random.randbytes(random.randint(0, 1400))))

    # save stimuli to file
    wrpcap("./test_input.pcap", packet_list, linktype=1)

    # run the python model to get the expected results
    udp_port_filter.process("./test_input.pcap", "./test_output_forward.pcap", "./test_output_drop.pcap", tb.dut.valid_udp_dst_port)

    # convert scapy to raw (bytearray)
    for packet in packet_list:
        stimuli_list.append(bytearray(raw(packet)))

    for packet in scapy.utils.rdpcap("./test_output_forward.pcap"):
        result_list.append(bytearray(raw(packet)))

    # start verify task
    check_task = cocotb.start_soon(checkTask(result_list, tb))

    # start sending data
    send_task = cocotb.start_soon(sendTask(stimuli_list, tb))

    # wait until all data is sent
    await Join(send_task)

    # send signal to stop receive tasks
    tb.testFinished = True

    # give the receive task a few microseconds to flush
    await Timer(10, units='us')
    
    # wait for receive task to finish
    await Join(check_task)
    return
```

# Conclusion
Digital twins can help to understand the core problem(s) and risks much faster and easier than straight VHDL coding from the beginning.
By leveraging the flexibility and popularity of python, we can reduce the time spent on VHDL coding to a minimum.
Using testframeworks like cocotb further ease the development cycle in a way, that we can create big and diverse testcases much faster and easier than using pure VHDL or Verilog based testcases.  

# glossary
[1] : FPGA - field programmable gate array, a computerchip like an ASIC, but reconfigurable<br/>
[2] : PCB - Printed Circuit Board<br/>
[3] : ICU - Intensive care unit<br/>
[4] : UDP - User Datagram Protocol - a connectionless OSI-layer 4 protocoll<br/>
[5] : PLL - Phase-locked loop - a circuit to synchronize or multiply clock frequencies<br/>
[6] : PCAP - a file format (and API) for packet capture, used by e.g. tcpdump and wireshark<br/>
