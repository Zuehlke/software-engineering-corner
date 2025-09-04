---
title: Digital Twins .. or why doing things twice is sometimes more efficient
domain: software-engineering-corner.hashnode.dev
tags: agile-development, programming-languages, hardware, best-practices
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1747223913763/rWSPApSkf.avi?auto=format
publishAs: sernst-zch
saveAsDraft: true
hideFromHashnodeCommunity: false
enableToc: true
---

## Reduce risks and fail faster in the FPGA / hardware waterfall world

Hardware engineers as well as FPGA[^1] engineers have the reputation of not fitting well into agile development sprints.
For example, how should a hardware engineer create a PCB[^2] within a week?
Similarly for FPGA engineering, we sometimes have to work longer than a sprint duration to achieve a shippable increment.
This is, because coding for FPGAs is often still bit-banging.
Both VHDL and Verilog are hardware description languages: They provide barely any abstraction from the underlying logic, so FPGA engineering is often reduced to connecting wires to flip-flops.
By contrast, what everyone wants to know before the project even starts is:
"How many FPGA resources will we need and how expensive is the device going to be?"
I can't tell. I don't even know if the paper-concept, which we created at the kick-off, works in real life.
It's like building a medieval castle with only stones and mortar and no exact building plan.
Only after the project has been finished will you know how long it took and how many stones were needed... and indeed whether it was feasible at all.

### How to actually build a medieval castle?

Imagine you're a builder and noble people contract you.
They request a new residence.
It shall be a castle, out of solid stone.
They are seven people and have five horses.

*"Be thou quick or thy head shall tumble"* - thus a deal was struck.

Well, how do you proceed?
According to most waterfall methods, we must first specify every requirement, both functional and non-functional, then build the solution, and finally test to verify that the requirements have been met.

So, you begin.

With an idea already in mind, you sketch a nice plan and then hastly begin to carve stones.
You carve and carve, carry the finished blocks over long distances from the quarry to the site.
You put one block on top of another, build walls, roofs and interiors and polish the door handles.
Finally, after a year  - or three - the castle is finished.

It looks just like the one on the plan you showed them in the beginning - from the outside that is.
The first time you walk through with the noble people, they say; "Yeah, nice and all, but where is the entrance for the horses?
The horses?
They will go into the stable in the backyard, we'll build them a nice shelt... THE BACKYARD?!
No, no, no, the horses should have been *inside* the castle! We don't want to leave them unprotected outside! It's a castle after all! And where do our 14 servants live? Surely we didn't need to mention that we never take care of the horses by ourselves.

Oh boy. Good thing we have python nowadays!

### A more realistic example: ICU patient supervision

You won't be surprised to learn that at Zühlke, we don't often build medieval stone castles.
As a more realistic (though still fictional) example, consider the development of a new device to remote monitor ICU[^3] patients in a hospital.
Besides a CPU with a webserver for remote monitoring, the device shall have an FPGA on it.
It shall act as a sensor fusion building block and network preprocessor as a first line of defence. This way, the system's reliability and attack resilience will be increased.
The surveillance application on the main processor-module shall only receive UDP[^4] frames which are sent to a specific destination port.

### Still the same old game?

We could now start the same way as our poor friends did a thousand years ago.
We would start up our VHDL code machines, carve code block after code block, create a super solid foundation to receive ethernet frames, have the PLLs[^5] lock and the data passing through the device at line speed and without bit-errors.
FPGA engineers know, those are time-consuming tasks, because before one can test anything, everything must be aligned with the hardware-specific properties of the target environment and the evaluation board.
Three weeks in our fictional project, the LED is blinking on the evaluation board and the VHDL testbench features a few test cases to prove that the UDP filter works.

So far so good.

Now, while trying to test the device with our noble customers, we find out that not only IPv4 but also IPv6 shall be supported.
Additionally, as soon as we hooked up our prototype to the test network in the hospital for the first field tests, random ARP frames began to pass through the filter, because the payload data matched the expected destination port by coincidence.
As it turns out, we shouldn't just compare the UDP destination port field on a fixed offset.
Both are learnings, that we just didn't think about in the beginning or during development.

## A better way: building a digital twin first

How can we minimize such risks?
Long before loading the first limestone block onto our carriage, or rather, hooking our device up to the customer's network for the first time, we could create a digital model of the FPGA and its surroundings.
By using Python and the huge ecosystem behind, we simply abstract all the time consuming hardware bring-up problems.
Similarly, our friend a thousand years ago wouldn't need to deal with foundation and swamp problems before building the first wall.
At the same time, a simple network capture or even synthetically generated data can replace the first walkthrough with our noblemen and spot problems before they are hard to remove.

I think you start to get the concept: we are turning the waterfall upside down.

Test-driven design shapes our implementation and from there we observe very quickly how the device acts in real life against our concept / requirements.
And because we now use Python, we are much faster in adapting our implementation.
Python is a high-level language and its ecosystem makes it very convenient to "just hack something". Not even mentioning AI GPTs that fluently speak Python but rarely VHDL.
The digital twin can be seen as a "dry run" before we actually start coding VHDL.

### Walkthrough
#### Creating a testbench

Enough theory and funny words; let's walk through from A-Z for our patient supervision case.
The filter we want to design shall only pass valid UDP frames with a specific destination port.

Instead of building the filter right away, let us create a testbench and generate (synthetic) data as a first step:

```python
from scapy.all import *
from scapy.layers.l2 import *
from scapy.layers.inet import *
from scapy.layers.inet6 import *

import udp_port_filter

valid_udp_dst_port = 1234

packet_list = []

# define how many packets each we want to simulate
sample_size = 100

# [BAD]: ARP
packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02") / ARP())

# [BAD]: IPv4, no UDP, random payload (and -length)
packet_list.append(
    Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")
    / IP(src="192.168.1.10", dst="192.168.1.15", proto=0x92)
    / raw(random.randbytes(random.randint(0, 1400)))
)

# [BAD]: IPv6 with no UDP
packet_list.append(
    Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")
    / IPv6(src="fe80::10", dst="fe80::15", nh=0x3B)
    / raw(random.randbytes(random.randint(0, 1400)))
)

# IPv4 with random destination port, random payload (and -length). Destination port is not the one we want, all should be dropped
for n in range(sample_size-1):
    dport = random.randint(0, 65535)
    if dport != valid_udp_dst_port:
        packet_list.append(
            Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")
            / IP(src="192.168.1.10", dst="192.168.1.15")
            / UDP(sport=random.randint(1, 65535), dport=dport)
            / raw(random.randbytes(random.randint(0, 1400)))
        )

# append one good one
packet_list.append(
    Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")
    / IP(src="192.168.1.10", dst="192.168.1.15")
    / UDP(sport=random.randint(1, 65535), dport=1234)
    / raw(random.randbytes(random.randint(0, 1400)))
)

# IPv6 with all ports, random payload (and -length). Destination port is not the one we want, all should be dropped
for n in range(sample_size-1):
    dport = random.randint(0, 65535)
    if dport != valid_udp_dst_port:
        packet_list.append(
            Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")
            / IPv6(src="fe80::10", dst="fe80::15")
            / UDP(sport=random.randint(1, 65535), dport=dport)
            / raw(random.randbytes(random.randint(0, 1400)))
        )

# append one good one
packet_list.append(
    Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")
    / IPv6(src="fe80::10", dst="fe80::15")
    / UDP(sport=random.randint(1, 65535), dport=1234)
    / raw(random.randbytes(random.randint(0, 1400)))
)

# save stimuli to file
wrpcap("./test_input.pcap", packet_list, linktype=1)
```

With [scapy](https://scapy.net/), we can create headers like `Ether(dst, src, type)` or `IP(src, dst, ...)` and concatenate them with the division operator `Ether()/IP()`.
The `raw` header lets us append or inject any length of bytes.
Scapy's utils package provides us with `wrpcap()`. This function takes a list of packets and writes them to a PCAP[^6] file, which you can open with wireshark.
Similarly, `rdpcap()` will read those packets back into scapy's packetList format.
The file `test_input.pcap` will now have around 200 packets, which we use as test data for our filter. Crucially, this testbench can later be reused together with [cocoTb](https://www.cocotb.org/) to test the VHDL implementation. In effect, the digital twin becomes the golden device, also known as a test oracle.

#### Creating the digital twin

When designing a digital twin for an FPGA, it's very important that we don't take too many shortcuts leveraging the python ecosystem.
We want to keep the FPGA resources and capabilities in mind.
A simple one-liner in python might do the trick as well, but we wouldn't gain any insights into the resources needed in VHDL for this.

First, let's define a function prototype with the following parameter:

- input file path
- output file path for frames that shall be forwarded (pass the filter)
- output file path for frames that are dropped (rejected by the filter)
- UDP destination port number as filter criteria

```python
from scapy.all import *
from scapy.layers.l2 import *
from scapy.layers.inet import *
from scapy.layers.inet6 import *

def process(input_file, output_file_forward, output_file_drop, valid_dst_port):
```

The next snippet abstracts the whole Ethernet subsystem with MAC and PLLs etc. With `rdpcap` we can load the test data previously generated in PCAP format.
Additionally, we initialize our output lists.

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

#### Connecting digital twin and testbench

Jumping back to our testbench, we can include the digital twin and call its `process` function.
This will allow us to dynamically recompute the expected results if we change the input data.

```python
udp_port_filter.process("./test_input.pcap", "./test_output_forward.pcap", "./test_output_drop.pcap", tb.dut.valid_udp_dst_port)
```

Running the testbench with our filter will give the following result:

```bash
python .\tb_udp_port_filter.py
Pass: 2 frames
Drop: 203 frames
```

With less than 100 lines of code, we built a complete virtual twin with testbench.
Instead of generating our test data, we could also feed our testbench with real-world data captured using utilities like tcpdump, wireshark or specialized hardware.

### Reusing the python testbench with cocoTb

Once we validated our digital twin, we can write our VHDL code.
With our digital twin, we get additional insights about intermediate results, the algorithm itself and how input and output shall look like.
To finally test the finished VHDL implementation, we can reuse our digital twin testbench by integrating cocoTb.
There are a few examples on how to use cocotb in the github repository under https://github.com/cocotb/cocotb/tree/master/examples.

All of them have a `cocotb.test()` routine, which is executed either by the framework in Makefile based testbenches or via runner on runner based testbenches (https://docs.cocotb.org/en/stable/runner.html).
The example below is a Makefile based testbench.

Two elements are present:

- A class `TB` which connects the VHDL source to the testbench (`dut` is an object provided by the framework)
- One or multiple `async def test_xyz(dut)` functions, which contain each the testbench sequence

In this example, we defined one test and several helper routines that run in parallel (async).
One is to send data over AXI-Stream and the other is to receive data over AXI-Stream while comparing it to the expected result.
Both are launched via `cocotb.start_soon()`.
The expected results are generated inside the `test_passthrough()` function on the line:  
`udp_port_filter.process("./test_input.pcap", "./test_output_forward.pcap", "./test_output_drop.pcap", tb.dut.valid_udp_dst_port)`

This is the same line as we used before in our digital twin testbench to call the python version of our code.
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

The following listing shows the full source file:

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
By leveraging the flexibility and popularity of Python, we can reduce the time spent on VHDL coding to a minimum.
Using test frameworks like cocotb further ease the development cycle in a way, that we can create an extensive collection of testcases much faster and easier than using pure VHDL or Verilog based testcases.  

[^1]: FPGA - field programmable gate array, a computer chip like an ASIC, but reconfigurable

[^2]: PCB - Printed Circuit Board

[^3]: ICU - Intensive care unit

[^4]: UDP - User Datagram Protocol - a connectionless OSI-layer 4 protocol

[^5]: PLL - Phase-locked loop - a circuit to synchronize or multiply clock frequencies

[^6]: PCAP - a file format (and API) for packet capture, used by e.g. tcpdump and wireshark
