'use strict';

/*

    AUTHOR:  Peter van der Walt
    Addional work by Nathaniel Stenzel and Sven Hecht

    LaserWeb Raster to GCODE Paperscript
    Copyright (C) 2015 Peter van der Walt

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
    WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
    MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
    ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
    WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
    ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
    OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

var startgcode;
var laseron;
var laseroff;
var lasermultiply;
var homingseq;
var endgcode;


// add MAP function to the Numbers function
Number.prototype.map = function(in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

function Rasterizer(config) {

    this.config = config;

    console.log('[Rasterizer] Width: ' + this.config.imgwidth + '  Height: ' + this.config.imgheight);

    // Init some variables we'll be using in the process
    this.path = '';
    this.intensity = '';
    //this.gcodex = '';

    this.moveCount = 0; // Keep count of Gcode lines so we can optimise, lower = better
    this.skip = 0;
    this.dir = 1;
    //this.lastPosx = -1;
    this.megaPixel = 0;
    this.x = 0;
    //this.endPosx = 0;
    this.grayLevel = 0;
    //this.gridSize = 1;
    this.startTime = 0;

    this.rasterIntervalTimer = null;

    // GCODE Header
    var useVariableSpeed = this.config.useVariableSpeed;

    startgcode = $('#startgcode').val();
    laseron = $('#laseron').val();
    laseroff = $('#laseroff').val();
    if ($('#lasermultiply').val()) {
      lasermultiply = $('#lasermultiply').val();
    } else {
      lasermultiply = 100;
      printLog('NB - generated with default value of S100 since you have not yet configured LaserWeb for your machine.  Click that settings button and configure the Max PWM S Value (and all the other settings please).... ', errorcolor)
    }
    homingseq = $('#homingseq').val();
    endgcode = $('#endgcode').val();

    this.result = [
        '; GCODE generated by Laserweb',
        // '; Firmware: {0}',
        '; Laser Min: {0}%',
        '; Laser Max: {1}%',
        '; Black Speed: {2}mm/min',
        '; White Speed: {3}mm/min',
        '; Resolution (mm per pixel): {4}mm',
        '; Laser Spot Size: {5}mm',
        '; Laser Feedrate: {6}mm/min',
        '; X Offset: {8}mm',
        '; Y Offset: {9}mm \n',
        'G1 F{7}\n'
        //'G0 F{7}'
    ].join('\n').format(
        // this.config.firmware,
        this.config.minIntensity,
        this.config.maxIntensity,
        useVariableSpeed ? this.config.blackRate : 'N/A ',
        useVariableSpeed ? this.config.whiteRate : 'N/A ',
        this.config.spotSize1,
        this.config.beamSize1,
        this.config.feedRate,
        this.config.rapidRate,
        this.config.xOffset,
        this.config.yOffset);



    this.result += '; Start GCode\n'
    this.result += startgcode

    // if (this.config.firmware.indexOf('Lasaur') == 0) {
    //   this.result += 'M80\n'; // Air Assist on
    // }

    console.log('Variable Speed?:  ' + useVariableSpeed);
}

Rasterizer.prototype.figureIntensity = function() {
    var intensity = (1 - this.grayLevel) * 100; //  Also add out Firmware specific mapping using intensity (which is 0-100) and map it between minIntensity and maxIntensity variables above * firmware specific multiplier (grbl 0-255, smoothie 0-1, etc)
    //Constraining Laser power between minIntensity and maxIntensity
    //console.log('Constraining');

    if (parseFloat(intensity) > 0) {
        intensity = intensity.map(0, 100, parseInt(this.config.minIntensity, 10), parseInt(this.config.maxIntensity, 10));
    } else {
        intensity = 0;
    }

    // Firmware Specific Gcode Output
    // if (this.config.firmware.indexOf('Grbl') == 0) {
    //   intensity = intensity.map(0, 100, 0, 255);
    //   intensity = intensity.toFixed(0);
    // } else if (this.config.firmware.indexOf('Smooth') == 0) {
    //   intensity = intensity / 100;
    //   //intensity = intensity.toFixed(1);
    // } else if (this.config.firmware.indexOf('Lasaur') == 0) {
    //   intensity = intensity.map(0, 100, 0, 255);
    //   intensity = intensity.toFixed(0);
    // } else {
    // intensity = intensity.map(0, 100, 0, parseInt(lasermultiply));
    // intensity = intensity.toFixed(0);

    if (parseInt(lasermultiply) <= 1) {
        var intensity = parseFloat(intensity) / 100;
        intensity = parseFloat(intensity).toFixed(2);
    } else {
        var intensity = parseFloat(intensity) * (parseInt(lasermultiply) / 100);
        intensity = intensity.toFixed(0);
    }
    // }

    return intensity;
};

Rasterizer.prototype.figureSpeed = function(passedGrey) {
    var calcspeed = passedGrey * 100;
    //console.log('Figure speed for brightness');

    calcspeed = calcspeed.map(0, 100, parseInt(this.config.blackRate, 10), parseInt(this.config.whiteRate, 10));
    calcspeed = calcspeed.toFixed(0);

    return calcspeed;
};

Rasterizer.prototype.init = function() {
    this.startTime = Date.now();

    // Initialise
    project.clear();

    // Create a raster item using the image tag 'origImage'
    this.raster = new Raster('origImage');
    this.raster.visible = false;

    // Log it as a sanity check
    console.log('Constraining Laser power between {0}% and {1}%'.format(this.config.minIntensity, this.config.maxIntensity));
    console.log('Height: {0}px, Width: {1}px'.format(this.config.imgheight, this.config.imgwidth));
    console.log('Spot Size: {0}mm'.format(this.config.spotSize1));
    console.log('Raster Width: {0} Height: {1}'.format(this.raster.width, this.raster.height));
    console.log('G0: {0}mm/min, G1: {1}mm/min'.format(this.config.rapidRate, this.config.feedRate));
    if (this.config.useVariableSpeed == "true") {
        console.log('Black speed: {0} Whitespeed: {1}'.format(this.config.blackRate, this.config.whiteRate));
    }

    // As the web is asynchronous, we need to wait for the raster to load before we can perform any operation on its pixels.
    this.raster.on('load', this.onRasterLoaded.bind(this));
};


Rasterizer.prototype.rasterRow = function(y) {
    //console.log('[Rasterizer] rasterRow', y);

    // Calculate where to move to to start the first and next rows - G0 Yxx move between lines

    var posy = y;
    // posy = (posy * this.config.spotSize1) - parseFloat(this.config.yOffset);
    if (this.config.imagePos == "TopLeft") {
    //   posy = (posy * this.config.spotSize1) - parseFloat(this.config.yOffset) + ((laserymax / 2) + this.config.imgheight);
      posy = (posy * this.config.spotSize1) + parseFloat(this.config.yOffset) - parseFloat(laserymax) + parseFloat(this.config.physicalHeight);
    } else {
      posy = (posy * this.config.spotSize1) - parseFloat(this.config.yOffset);
    }
    posy = posy.toFixed(1);

    // Offset Y since Gcode runs from bottom left and paper.js runs from top left
    var gcodey = (this.config.imgheight * this.config.spotSize1) - posy;
    gcodey = gcodey.toFixed(3);
    this.result += 'G0 Y{0}\n'.format(gcodey);

    // Clear grayscale values on each line change
    var lastGrey = -1;
    var lastIntensity = -1;

    // Get a row of pixels to work with
    var ImgData = this.raster.getImageData(0, y, this.raster.width, 1);
    var pixels = ImgData.data;

    // Run the row:
    for (var px = 0; px <= this.raster.width; px++) {
        var x;
        var posx;
        if (this.dir > 0) { // Forward
            x = px;
            posx = x;
        } else { // Backward
            x = this.raster.width - px - 1;
            posx = x + 1;
        }

        // Convert Pixel Position to millimeter position
        posx = (posx * this.config.spotSize1 + parseFloat(this.config.xOffset));
        posx = posx.toFixed(3);
        // Keep some stats of how many pixels we've processed
        this.megaPixel++;

        // The Luma grayscale of the pixel
        var lumaGray;
	if (pixels[x*4+3] == 0) lumaGray = 1.0; // If full transparency => 0 intensity
	else lumaGray = (pixels[x*4]*0.3 + pixels[x*4+1]*0.59 + pixels[x*4+2]*0.11)/255.0;  // 0-1.0
	this.grayLevel = Math.round(lumaGray*lasermultiply)/lasermultiply; // Should give "lasermultiply" levels in the range 0-1

        var speed = this.config.feedRate;
        if (lastGrey = this.grayLevel) { 
            intensity = this.figureIntensity();
            speed = this.figureSpeed(lastGrey);
            lastGrey = this.grayLevel;
        }

        // Can't miss the first pixel (;
        //if (px == 0) { this.lastPosx = posx; }

        //if we are on the last dot, force a chance for the last pixel while avoiding forcing a move with the laser off
        if (px == this.raster.width) {
            intensity = -1;
        }

        // If we dont match the grayscale, we need to write some gcode...
        if (intensity != lastIntensity) {
            this.moveCount++;

            //console.log('From: ' + this.lastPosx + ', ' + lastPosy + '  - To: ' + posx + ', ' + posy + ' at ' + lastIntensity + '%');
            if (lastIntensity > 0) {
                if (this.config.useVariableSpeed == "true") {
                    // if (this.config.firmware.indexOf('Grbl') == 0) {
                    //   this.result += 'M3 S{2}\nG1 X{0} Y{1} F{3} S{2}\nM5\n'.format(posx, gcodey, lastIntensity, speed);
                    // } else {
                    if (laseron) {
                        this.result += laseron
                        this.result += '\n'
                    }
                    this.result += 'G1 X{0} Y{1} S{2} F{3}\n'.format(posx, gcodey, lastIntensity, speed);
                    if (laseroff) {
                        this.result += laseroff
                        this.result += '\n'
                    }
                    // }
                } else {
                    // if (this.config.firmware.indexOf('Grbl') == 0) {
                    //   this.result += 'M3 S{2}\nG1 X{0} Y{1} S{2}\nM5\n'.format(posx, gcodey, lastIntensity);
                    // } else {
                    if (laseron) {
                        this.result += laseron
                        this.result += '\n'
                    }
                    this.result += 'G1 X{0} Y{1} S{2}\n'.format(posx, gcodey, lastIntensity);
                    if (laseroff) {
                        this.result += laseroff
                        this.result += '\n'
                    }
                    // }
                }
                // This will hopefully get rid of black marks at the end of a line segment
                // It seems that some controllers dwell at a spot between gcode moves
                // If this does not work, switch to G1 to this.endPosx and then G0 to posx
                //this.result += 'G1 S0\n';
            } else {
                if ((intensity > 0) || (this.config.optimizelineends == false)) {
                    this.result += 'G0 X{0} Y{1} S0\n'.format(posx, gcodey);
                }

            }

            // Debug:  Can be commented, but DON'T DELETE - I use it all the time when i find bug that I am not sure of
            // whether the root cause is the raster module or the gcode viewer module - by drawing the paper.js object I can
            // do a comparison to see which it is
            // Draw canvas (not used for GCODE generation)
            //path = new Path.Line({
            //    from: [(this.lastPosx * this.gridSize), (posy * this.gridSize)],
            //    to: [(this.endPosx * this.gridSize), (posy * this.gridSize)],
            //    strokeColor: 'black'
            //    });
            //path.strokeColor = 'black';
            //path.opacity = (lastIntensity / 100);
            // End of debug drawing
        } else {
            this.skip++
        }

        // End of write a line of gcode
        //this.endPosx = posx;

        // Store values to use in next loop
        if (intensity != lastIntensity) {
            lastIntensity = intensity;
            //this.lastPosx = posx
        }
    }

    this.dir = -this.dir; // Reverse direction for next row - makes us move in a more efficient zig zag down the image
};


Rasterizer.prototype.rasterInterval = function() {
    if (this.currentPosy < this.raster.height) {

        this.rasterRow(this.currentPosy);

        this.currentPosy++;
        var progress = Math.round((this.currentPosy / this.raster.height) * 100.0);
        //$('#rasterProgressShroud .progress-bar').width(progress + "%");
        $('#rasterProgressPerc').html(progress + "%");
        NProgress.set(progress / 100);
        //console.log('[Rasterizer] ', progress, '% done');
    } else {
        this.onFinish();
        //var rasterSendToLaserButton = document.getElementById("rasterWidgetSendRasterToLaser");
        //if (rasterSendToLaserButton.style.display == "none") { // Raster Mode
        NProgress.done();
        NProgress.remove();
        //$('#rasterparams').hide();
        //$('#rasterwidget').modal('hide');
        // } else {  // Calibration Mode
        $('#rasterparams').show();
        $('#rasterProgressShroud').hide();
        //   $('.progress').removeClass('active');
        // 	$('#rasterProgressShroud .progress-bar').width(0);
        // }
        window.clearInterval(this.rasterIntervalTimer);
    }
};

Rasterizer.prototype.onRasterLoaded = function() {
    //console.log('[Rasterizer] onRasterLoaded');
    var rasterSendToLaserButton = document.getElementById("rasterWidgetSendRasterToLaser");
    //if (rasterSendToLaserButton.style.display == "none") {  // Raster Mode
    $('#rasterparams').hide();
    $('#rasterProgressShroud').show();
    $('.progress').removeClass('active');
    $('#rasterProgressShroud .progress-bar').width(0);
    // } else {  // Calibration Mode
    //   $('#rasterparams').hide();
    //   $('#rasterProgressShroud').show();
    //   $('.progress').removeClass('active');
    // 	$('#rasterProgressShroud .progress-bar').width(0);
    // }

    // Iterate through the Pixels asynchronously
    this.currentPosy = 0;
    this.rasterIntervalTimer = window.setInterval(this.rasterInterval.bind(this), 10);
};

Rasterizer.prototype.onFinish = function() {
    // if (firmware.indexOf('Lasaur') == 0) {
    //   this.result += 'M81\n'; // Air Assist off
    // }

    // Populate the GCode textarea
    document.getElementById('gcodepreview').value = this.result;
    console.log('Optimized by number of line: ', this.skip);

    // Some Post-job Stats and Cleanup
    console.log('Number of GCode Moves: ', this.moveCount);
    var pixeltotal = this.raster.width * this.raster.height;
    console.log('Pixels: {0} done, of {1}'.format(this.megaPixel, pixeltotal));

    console.timeEnd("Process Raster");
    var currentTime = Date.now();
    var elapsed = (currentTime - this.startTime);
    $('#console')
        .append('<p class="pf" style="color: #009900;"><b>Raster completed in {0}ms</b></p>'.format(elapsed))
        .scrollTop($("#console")[0].scrollHeight - $("#console").height());

    if (this.config.completed) {
        this.config.completed();
    }
};


this.RasterNow = function(config) {
    console.time("Process Raster");
    printLog('Process Raster', msgcolor)

    var rasterizer = new Rasterizer(config);
    rasterizer.init();
};
