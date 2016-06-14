
# LaserWeb v2


##Sponsors

So how can I help?

*Easy! Pick a contributor, and show them you care! *

If you sell laser machines / parts / electronics / anything remotely related - I am happy to say we'll gladly take your bribe in exchange for sticking your logo on our SPONSORS page and linking to your stores! We'll probably even hook up the hardware you donate and figure out how it works and add that info/specifics/settings to this Wiki! If you have any business common sense, you can see that it is a pretty good ROI out of your marketing budget (;

#Usage Note:
LaserWeb is under active development and thus LaserWeb2 has now been changed to provide only CAM function with GCODE download. Should you wish to continue using it with Serial connection [use version a2145c5 ](https://github.com/openhardwarecoza/LaserWeb2/tree/a2145c5695e332be71c1374887c23eb99cf413a8) on a locally installed machine or fork to your own repository and visit the link as shown below. #72


#Usage Instructions:

1. Go to [http://openhardwarecoza.github.io/LaserWeb2/](http://openhardwarecoza.github.io/LaserWeb2/)
2. Import your design and prepare it
3. Save GCODE and run it on the machine with some other firmware
4. See above Usage Note if you wish to use it with Serial connection.

 
## Disclaimer
By using this software, the user accepts complete responsibility for each and every aspect of safety associated with the use of the Laser machine, Laser system and LaserWeb2 Software.



####You agree that:

1. You will not hold the author or contributors of LaserWeb liable for any damage to equipment or persons from the use of LaserWeb2. 
2. You know the potential hazards in using high power lasers and high voltages.
3. You will wear professional laser-eye-protection when using a laser controlled by LaserWeb2.
4. You will use the LaserWeb2 software in a legal and safe manner.
5. You relieve the author and contributors from any liability arising from the use or distribution of the LaserWeb2 software.
6. You are entirely operating at your own risk. Lasers can be lethally dangerous. 
 


#Support / Community:
* For End User support (Usage, setup etc) please join [https://plus.google.com/communities/115879488566665599508](https://plus.google.com/communities/115879488566665599508)
* For Development Support (Bugs, feature requests, API, etc) see 
[https://github.com/openhardwarecoza/LaserWeb2/issues](https://github.com/openhardwarecoza/LaserWeb2/issues)


## Internal module development
It would be more maintainable if we could develop more functional modules, that are tested.

<i>Example</i>: grbl.js has test code. It is a stand alone module that parses messages from a grbl device and stores all data in the grbl object, created by ` var grbl = new Grbl()` 
### how to test
``` 
npm install // installs mocha and chai
npm test // runs test code on grbl.js
```

#Roadmap

As of middle May 2016:

![Roadmap](https://raw.githubusercontent.com/openhardwarecoza/LaserWeb2/gh-pages/Roadmap-%20LaserWeb2.png)

##History

Laserweb (https://github.com/openhardwarecoza/LaserWeb) was born out of a need! Last year when I gave up on getting a certain well known open source java based laser cutting software to work and my skills at the time didnt allow me to complete my development inside Chilipeppr - i caved in and did what I could to help myself get going! The result of which astounds even me! In just over three months LaserWeb grew to be a massively successful opensource project!  But its not without its flaws...

Thus, this here is it's successor: LaserWeb2!

Want to get involved? Simple - we have a couple of Contributors on the project, who have devoted time and effort into making LaserWeb better than it was before they joined. Many of these contributors do it for nothing more than the passion of working on an open source project, and some don't even own a laser.

Through the wonder that is the global open source community, however, lack of a laser hasn't stopped them! If you follow our team on Google Plus you'll know that we sometimes go as far as having three or four people in different time zones, collaborating on code, while having someone else in the team test it out on real hardware. It has not been easy, but we won't let that stop us!
