---
title: Digital Twins .. or why doing things twice is sometimes more efficient
domain: software-engineering-corner.hashnode.dev
tags: agile development, digital twin, fpga development, method, hardware engineering 
cover: https://cdn.hashnode.com/res/hashnode/image/upload/v1727431394860/XZ6VWy5WU.jpg?auto=format
publishAs: sernst-zch
saveAsDraft: true
hideFromHashnodeCommunity: false
enableToc: true
---

## Reduce risks and fail faster in the FPGA / hardware waterfall world

Hardware engineers as well as FPGA[<sup>1</sup>](#footnotes) engineers have the reputation of not fitting well into agile development sprints.
How should one create a PCB[<sup>2</sup>](#footnotes) within a week?
It's sometimes similar for FPGA engineers.
Coding VHDL or Verilog is bit-banging, both are hardware description languages, there is barely any abstraction and basically consists of connecting wires to flip-flops.
In addition, the thing that everyone wants to know before the project even starts, is: "How big will it be and how expensive is the device?".
I can't tell. I don't even know, if the concept we had works.
It's like building a castle with only stones and mortar. You only know after the project how long it took and how many stones were needed... and if it was feasible at all.

### How to actually build a medieval castle?

Imagine you're the builder and being contracted by noble people.
They want a castle.
Out of solid stone.
It shall be big, they have five horses, and they are 7 people.
*"Be quicketh or Thy head shall tumble"* and the deal was made.
Well, how do you proceed?
You start carving stones, carry them over long distances from the quarry to the site, put one on top of another, build walls, roofs and polish the door handles. Finally, after a year, the house is finished.
It looks just like the one on the painting you showed them in the beginning.
From the outside.
The first time you walk through it with the noble people, they say; "Yeah, nice and all, but where is the entry for the horses?
The horses?
They will go into the stable in the backyard, we'll build a nice shelt... THE BACKYARD?!
No, the horses should have been *inside* the castle!
It's a castle after all! And where do our 14 servants live? We obviously don't need to mention, that we don't take care of the horses by ourselves.

oh boy..

### a more recent example: ICU patient supervision

Usually, at Zuehlke, we don't build stone castles.
Rather e.g. a new device for remote supervision of ICU[<sup>3</sup>](#footnotes) patients in a hospital.
This is a fictional example, but suitable for demonstration purposes.
The device has an FPGA on it, acting as sensor fusion building block and network preprocessor as a first line of defence to increase the reliability and attack resilience of the system.
The surveillance application on the main processor-module shall only receive certain UDP[<sup>4</sup>](#footnotes) frames.

### the same game

We could now start the same as our poor friends a thousand years ago.
We would start up our VHDL code machines, carve lines after lines, create a super solid foundation to receive ethernet frames and have the PLLs lock and the data passing through the device with line speed and no bit-errors.
The led is blinking, everything works in the testbench.
So far so good.
Three weeks in the project and together with the noble customers, we find out that not only IPv4 but also IPv6 shall be supported.
Additionally, as soon as we hooked up our prototype to the test network in the hospital for the first field tests, random spanning-tree frames would pass the filter als false-negatives, as the payload data is by coincidence just at the right byte equal to our pass criteria.

## The better way: building a digital twin first

Good thing we have python nowadays!
Far before we load the first limestone to our carriage and far before we hook up our device the first time to our customers network, we can now create a digital model of what we plan to do.
The huge python ecosystem can abstract all the foundation and swamp problems; a simple network capture replaces the first walkthrough test with our noblemen.
I think you start to get the concept.

### Where to start

Let's craft a skeleton in python for our UDP filter. We can use e.g. the [scapy](https://scapy.net/) framework to abstract the whole packet reception, PCAP[<sup>5</sup>](#footnotes) file handling and parsing/dumping.
Important here is now, that we make use of the python ecosystem but don't take too many shortcuts.
We want to keep the FPGA ressources and capabilites in mind, to be able to later estimate how complicated it's going to get in the actual FPGA implementation.
A simple one-liner in python might do the trick to show that the concept works, but we wouldn't get any insights of the ressources needed in VHDL for this.

```python
from scapy.all import *
from scapy.layers.l2 import *
from scapy.layers.inet import *
from scapy.layers.inet6 import *

def process(input_file, output_file_forward, output_file_drop, valid_dst_port):
```

We define a function that takes an input file path, an output file path for frames that shall be forwarded (pass the filter) and one for frames that are dropped by the filter (rejected by the filter).
Additionally, we need the valid destination port number to compare the UDP header to.

The next snipped abstracts now the whole Ethernet subsystem with MAC and PLLs etc. We simply read a PCAP capture as stimuli.
Additionally, we initialize our output lists to later fill them with data.
rdpcap is a function inside the scapy.utils package.

```python
input_frame_list = rdpcap(input_file)
output_frame_list = []
dropped_frame_list = []
```

Then comes the filter itself.
Again, we could have made this simpler. Intentionally, we do this step by step as in the final VHDL implementation, we probably want to use registers and or a pipeline for this.

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

### How about some testdata?

Let's build a testbench, define testcases and run the example. The good thing is, this testbench can later be reused together with [cocoTb](https://www.cocotb.org/) to run VHDL code next to it and compare the output with our golden device, the python implementation.
Notice how easy it is to create a new testcase? FPGA engineers will understand the struggle.

The following snipped will create a sweep over all 65536 destination ports. Because we generate two sweeps, one over IPv4 and one over IPv6, we expect two frames that pass this testbench.

```python
from scapy.all import *
from scapy.layers.l2 import *
from scapy.layers.inet import *
from scapy.layers.inet6 import *

import udp_port_filter

valid_dst_port = 1234

packet_list = []

# [BAD]: ARP
packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/ARP())

# [BAD]: IPv4, no UDP, random payload (and -length)
packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IP(src="192.168.1.10", dst="192.168.1.15", proto=0x92 )/raw(random.randbytes(random.randint(0, 1400))))

# [BAD]: IPv6 with no UDP
packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IPv6(src="fe80::10", dst="fe80::15", nh=0x3B)/raw(random.randbytes(random.randint(0, 1400))))

# [One Good, others Drop]: IPv4 with all ports, random payload (and -length)
for dport in range(65536):
    packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IPv6(src="fe80::10", dst="fe80::15")/UDP(sport=random.randint(1,65535), dport=dport)/raw(random.randbytes(random.randint(0, 1400))))

# [One Good, others Drop]: IPv6 with all ports, random payload (and -length)
for dport in range(65536):
    packet_list.append(Ether(src="22:11:11:11:00:01", dst="22:22:22:22:00:02")/IP(src="192.168.1.10", dst="192.168.1.15")/UDP(sport=random.randint(1,65535), dport=dport)/raw(random.randbytes(random.randint(0, 1400))))


# save stimuli to file
wrpcap("./test_input.pcap", packet_list)

# run the testbench
udp_port_filter.process("./test_input.pcap", "./test_output_forward.pcap", "./test_output_drop.pcap", valid_dst_port)
```

running this testbench will give the following result:

```bash
python .\tb_udp_port_filter.py
Pass: 2 frames
Drop: 131073 frames
```

With less than 100 lines of code, we built a complete virtual twin with testbench.
Instead of generating our testdata from within the testbench, we could feed it with real world captured data using utilities like tcpdump or specialized hardware.


# footnotes
[1] : FPGA - field programmable gate array, a computerchip like an ASIC, but reconfigurable<br/>
[2] : PCB - Printed Circuit Board<br/>
[3] : ICU - Intensive care unit<br/>
[4] : UDP - User Datagram Protocol - a connectionless OSI-layer 4 protocoll<br/>
[5] : PCAP - a file format (and API) for packet capture, used by e.g. tcpdump and wireshark<br/>
