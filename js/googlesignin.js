var googleUser = {};

var startApp = function() {
    console.log('Starting GSingIn')
    if (typeof(gapi) !== "undefined")  {
      gapi.load('auth2', function(){
        // Retrieve the singleton for the GoogleAuth library and set up the client.
        auth2 = gapi.auth2.init({
          client_id: '1086441811451-4nmidqbqq8tve1qqa592uq1hs04kl5sl.apps.googleusercontent.com',
          cookiepolicy: 'single_host_origin',
          // Request scopes in addition to 'profile' and 'email'
          scope: 'https://www.googleapis.com/auth/drive'
        });

        attachSignin(document.getElementById('g-login'));
        printLog('Enabled Google Drive integration', successcolor);

      });
    } else {
      printLog('Could not enable Google Drive Integration: Does this device have working internet access?', warncolor);
      $('#g-login').addClass('disabled');
    }

};

function attachSignin(element) {
    console.log(element.id);
    auth2.attachClickHandler(element, {},
        function(googleUser) {
          $('#g-login').hide();
          $('#g-logout').show();
          $('#g-refresh').show();
          $('#fullname').html( 'Logged in as:<br> <b>' + googleUser.getBasicProfile().getName() + '</b>');
          $("#userpic").attr("src", googleUser.getBasicProfile().getImageUrl());
          gapi.client.load('drive', 'v3', function(){
             console.log('Drive Loaded');
             listFiles();
          });


        }, function(error) {
          console.log(JSON.stringify(error, undefined, 2));
        });
}

function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
  $('#g-login').show();
  $('#g-logout').hide();
  $('#g-refresh').hide();
  $('#fullname').html('Please Sign In:');
  $("#userpic").attr("src", 'css/user64.gif');
}

/**
* Print files.
*/
function listFiles() {
 $('#fileList').empty();
 var request = gapi.client.drive.files.list({
     'pageSize': 10,
     'fields': "nextPageToken, files(id, name)"
   });

   request.execute(function(resp) {

     $('#fileList').append('<B>Google Drive Files:</b><p>');
     var files = resp.files;
     if (files && files.length > 0) {
       for (var i = 0; i < files.length; i++) {
         var file = files[i];
         console.log('GDrive: Found ', file)
         if (file.name.match(/.dxf$/i) || file.name.match(/.svg$/i) ) {
           var idstring = String(file.id)
           $('#fileList').append("<i class='fa fa-fw fa-file-o' aria-hidden='true'></i><a href='#' onclick='getFileContent(\""+file.id+"\",\""+file.name+"\")'>"+file.name+"</a><br/>");
           $('#fileList').scrollTop($("#console")[0].scrollHeight - $("#console").height());
         }

         //appendPre(file.name + ' (' + file.id + ')<br>');
        //  getFileContent(file.id);
       }
     } else {
       printLog('No files found.', warncolor);
     }
   });
}

 /**
  * Append a pre element to the body containing the given message
  * as its text node.
  *
  * @param {string} message Text to be placed in pre element.
  */



function getFileContent(fileId, fileName) {
  console.log('fetching ', fileId)
  gapi.client.request({
  'path': '/drive/v2/files/'+fileId,
  'method': 'GET',
  callback: function ( theResponseJS, theResponseTXT ) {
      var myToken = gapi.auth.getToken();
      var myXHR   = new XMLHttpRequest();
      myXHR.open('GET', theResponseJS.downloadUrl, true );
      myXHR.setRequestHeader('Authorization', 'Bearer ' + gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token );
      myXHR.onreadystatechange = function( theProgressEvent ) {
          if (myXHR.readyState == 4) {
//          1=connection ok, 2=Request received, 3=running, 4=terminated
              if ( myXHR.status == 200 ) {
//              200=OK
                  //console.log( myXHR.response );
                  cleanupThree();
                  $('#cammodule').show();
                  $('#rastermodule').hide();
                  getSettings();
                  if (fileName.match(/.dxf$/i)) {
                    drawDXF(myXHR.response);
                    printLog('Google Drive DXF File Opened', successcolor);
                  } else if (fileName.match(/.svg$/i)) {
                    drawSVG(myXHR.response);
                    printLog('Google Drive SVG File Opened', successcolor);
                  }
                  currentWorld();
                  $('#cammodule').show();
                  putFileObjectAtZero();
                  resetView()
                  $('#stlopt').hide();
                  $('#prepopt').show();
                  $('#prepopt').click();
                  attachTransformWidget();
                  $('#filestatus').hide();
                  if ($( "#togglefile" ).hasClass( "btn-default" )) {
                    $('#togglefile').click();
                  }
              }
          }
      }
      myXHR.send();
  }
});
		};

$(document).ready(function() {
  startApp();
});
