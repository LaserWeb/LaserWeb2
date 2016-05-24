var minpwr;
var maxpwr;
var spotSizeMul;
var laserRapid;
var width;
var height;
var rectWidth;
var rectHeight;
var boundingBox;
var BBmaterial;
var BBgeometry;
var intensity;
var rastermesh; // see main.js - image shown on three canvas of raster


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

function drawRaster() {

    // Remove the UI elements from last run
    cleanupThree();


    $('#rasterProgressShroud').hide();
    $('#rasterparams').show();
    $("body").trigger("click") // close dropdown menu

    if ($('#useRasterBlackWhiteSpeeds').prop('checked')) {
        $("#blackwhitespeedsection").show();
    } else {
        $("#blackwhitespeedsection").hide();
    }
    // $('#rasterwidget').modal('show');
    // $('#rasterparams').show();
    // $('#rasterProgressShroud').hide();
    // var rasterWidgetTitle = document.getElementById("rasterModalLabel");
    // rasterWidgetTitle.innerText = 'Raster Engraving';
    // var sendToLaserButton = document.getElementById("rasterWidgetSendRasterToLaser");
    // sendToLaserButton.style.display = "none";
    // var rasterOutput = document.getElementById("rasterOutput");
    // rasterOutput.style.display = "none";
    // var selectedFile = event.target.files[0];
    // var reader = new FileReader();
    // document.getElementById('fileImage').value = '';
};

function rasterInit() {
    // printLog('Raster module Activated', msgcolor)

    // Raster support
    var paperscript = {};

    $("#laserpwrslider").slider({
        range: true,
        min: 0,
        max: 100,
        values: [0, 100],
        slide: function(event, ui) {
            minpwr = [ui.values[0]];
            maxpwr = [ui.values[1]];
            $('#rasterNow').removeClass('disabled');
            $('#laserpwr').html($("#laserpwrslider").slider("values", 0) + '% - ' + $("#laserpwrslider").slider("values", 1) + '%');
            setImgDims()
        }
    });
    $('#laserpwr').html($("#laserpwrslider").slider("values", 0) + '% - ' + $("#laserpwrslider").slider("values", 1) + '%');
    minpwr = $("#laserpwrslider").slider("values", 0);
    maxpwr = $("#laserpwrslider").slider("values", 1);

    $("#spotsizeslider").slider({
        min: 0,
        max: 250,
        values: [100],
        slide: function(event, ui) {
            //spotSize = [ui.values[ 0 ]];
            $('#rasterNow').removeClass('disabled');
            setImgDims()
        },
        change: function(event, ui) {
            //spotSize = [ui.values[ 0 ]];
            $('#rasterNow').removeClass('disabled');
            setImgDims()
        }
    });

    $("#laservariablespeedslider").slider({
        range: true,
        min: 0,
        max: 100,
        values: [20, 80],
        slide: function(event, ui) {
            $('#rasterNow').removeClass('disabled');
            laserRapid = $('#rapidRate').val();
            $('#laservariablespeed').html($("#laservariablespeedslider").slider("values", 0) * laserRapid / 100.0 + ' - ' + $("#laservariablespeedslider").slider("values", 1) * laserRapid / 100.0);
        }
    });
    $('#laservariablespeed').html($("#laservariablespeedslider").slider("values", 0) * $('#rapidRate').val() / 100.0 + ' - ' + $("#laservariablespeedslider").slider("values", 1) * $('#rapidRate').val() / 100.0);

    $("#useRasterBlackWhiteSpeeds").change(function() {
        if ($('#useRasterBlackWhiteSpeeds').prop('checked')) {
            $("#blackwhitespeedsection").show();
        } else {
            $("#blackwhitespeedsection").hide();
        }
    });

    $("#rapidRate").change(function() {
        $('#laservariablespeed').html($("#laservariablespeedslider").slider("values", 0) * $('#rapidRate').val() / 100.0 + ' - ' + $("#laservariablespeedslider").slider("values", 1) * $('#rapidRate').val() / 100.0);
    });

    $('#spotsize').html(':  ' + ($("#spotsizeslider").slider("values", 0) / 100) + 'mm ');
    spotSizeMul = $("#spotsizeslider").slider("values", 0) / 100;

    $('#rasterNow').on('click', function() {
        $('#rasterWidgetSendRasterToLaser').addClass('disabled');
        var spotSize = $("#spotsizeslider").slider("values", 0) / 100;
        var laserFeed = $('#feedRate').val();
        var laserRapid = $('#rapidRate').val();
        var blackspeed = $("#laservariablespeedslider").slider("values", 0) * laserRapid / 100.0;
        var whitespeed = $("#laservariablespeedslider").slider("values", 1) * laserRapid / 100.0;
        var useVariableSpeed = $('#useRasterBlackWhiteSpeeds').prop('checked');
        $('#rasterProgressShroud').hide();

        paper.RasterNow({
            completed: gcodereceived,
            minIntensity: [minpwr],
            maxIntensity: [maxpwr],
            spotSize1: [spotSize],
            imgheight: [height],
            imgwidth: [width],
            feedRate: [laserFeed],
            blackRate: [blackspeed],
            whiteRate: [whitespeed],
            useVariableSpeed: [useVariableSpeed],
            rapidRate: [laserRapid]
        });
    });

    $('#spotSize').bind('input propertychange', function() {
        //console.log('empty');
        // Todo if empty
        if (this.value.length) {
            setImgDims();
        }
    });
}


function setImgDims() {
    spotSizeMul = $("#spotsizeslider").slider("values", 0) / 100;
    minpwr = $("#laserpwrslider").slider("values", 0);
    maxpwr = $("#laserpwrslider").slider("values", 1);
    var img = document.getElementById('origImage');
    width = img.naturalWidth;
    height = img.naturalHeight;
    $("#dims").text(width + 'px x ' + height + 'px');
    $('#canvas-1').prop('width', (width * 2));
    $('#canvas-1').prop('height', (height * 2));
    //$('#canvas-1').prop('width', laserxmax);
    //$('#canvas-1').prop('height', laserymax);
    if (spotSizeMul > 1 ) {
      var physwidth = (spotSizeMul * width) + (spotSizeMul / 100);
      var physheight = (spotSizeMul * height) +  (spotSizeMul / 100);
    } else {
      var physwidth = (spotSizeMul * width) - (spotSizeMul / 100);
      var physheight = (spotSizeMul * height) - (spotSizeMul / 100);
    }


    $("#physdims").text(physwidth.toFixed(1) + 'mm x ' + physheight.toFixed(1) + 'mm');
    $('#spotsize').html(($("#spotsizeslider").slider("values", 0) / 100) + 'mm (distance between dots )');
    //$('#spotsize').html( ($( "#spotsizeslider" ).slider( "values", 0 ) / 100) + 'mm (distance between dots )<br>Resultant Job Size: '+ physwidth.toFixed(1)+'mm x '+physheight.toFixed(1)+'mm' );

    //  Draw a rect showing outer dims of Engraving - engravings with white space to sides are tricky to visualise without
    rectWidth = physwidth + spotSizeMul, rectHeight = physheight + spotSizeMul;
    if (boundingBox) {
        scene.remove(boundingBox);
    }
    BBmaterial = new THREE.LineDashedMaterial({
        color: 0xcccccc,
        dashSize: 10,
        gapSize: 5,
        linewidth: 2
    });
    BBgeometry = new THREE.Geometry();
    BBgeometry.vertices.push(
        new THREE.Vector3(-spotSizeMul, 0, 0),
        new THREE.Vector3(-spotSizeMul, (rectHeight + 1), 0),
        new THREE.Vector3((rectWidth + 1), (rectHeight + 1), 0),
        new THREE.Vector3((rectWidth + 1), 0, 0),
        new THREE.Vector3(-spotSizeMul, 0, 0)
    );
    boundingBox = new THREE.Line(BBgeometry, BBmaterial);
    boundingBox.translateX(laserxmax / 2 * -1);
    boundingBox.translateY(laserymax / 2 * -1);
    scene.add(boundingBox);

    if (rastermesh) {

        if (spotSizeMul > 1 ) {
          rastermesh.scale.x = spotSizeMul;
          rastermesh.scale.y = spotSizeMul;
        } else {
          rastermesh.scale.x = spotSizeMul;
          rastermesh.scale.y = spotSizeMul;
        }

        var bbox2 = new THREE.Box3().setFromObject(rastermesh);
        console.log('bbox for rastermesh: Min X: ', (bbox2.min.x + (laserxmax / 2)), '  Max X:', (bbox2.max.x + (laserxmax / 2)), 'Min Y: ', (bbox2.min.y + (laserymax / 2)), '  Max Y:', (bbox2.max.y + (laserymax / 2)));
        var Xtofix = -(bbox2.min.x + (laserxmax / 2));
        console.log('ImagePosition', imagePosition)
        var Ytofix = -(bbox2.min.y + (laserymax / 2));
        console.log('X Offset', Xtofix)
        console.log('Y Offset', Ytofix)
        rastermesh.translateX(Xtofix);
        rastermesh.translateY(Ytofix);
        currentWorld();

    }
};

function gcodereceived() {
    printLog('Raster Completed', msgcolor)
        //var rasterSendToLaserButton = document.getElementById("rasterWidgetSendRasterToLaser");
        //if (rasterSendToLaserButton.style.display == "none") {
        // 	//$('#rasterwidget').modal('hide');

    $('#rasterProgressShroud').hide();
    $('#rasterparams').show();
    // } else {
    // 	$('#rasterWidgetSendRasterToLaser').removeClass('disabled');
    // }
    console.log('New Gcode');
    //$('#sendToLaser').removeClass('disabled');
    openGCodeFromText();
    gCodeToSend = document.getElementById('gcodepreview').value;
    //$('#mainStatus').html('Status: <b>Gcode</b> loaded ...');
    //$('#openMachineControl').removeClass('disabled').prop("disabled", false);
    //$('#sendCommand').removeClass('disabled');
    //$('#sendToLaser').removeClass('disabled');
    $('#viewReset').click();

};
