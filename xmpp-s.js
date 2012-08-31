
var HTTP_BIND_URL = "http://192.168.0.90/http-bind/";
var HTTP_BASE_URL = "http://192.168.0.90/courses/c1/";
var XMPP_DOMAIN = "im.cd";
var XMPP_RESOURCE = "Student_Web";
var XMPP_SUBJECT_CONTENT = "Content";
var XMPP_SUBJECT_NAVIGATION = "Navigation";

function handleIQ(oIQ) {
  /*document.getElementById('iResp').innerHTML +="<div class='msg'>IN (raw): " +oIQ.xml().htmlEnc() + '</div>';
  document.getElementById('iResp').lastChild.scrollIntoView();
  con.send(oIQ.errorReply(ERR_FEATURE_NOT_IMPLEMENTED));
  */
}

function handleMessage(oJSJaCPacket) {
  command=oJSJaCPacket.getSubject();
  if (command == XMPP_SUBJECT_CONTENT) { 
	setContent(oJSJaCPacket.getBody());
  } else if (command == XMPP_SUBJECT_NAVIGATION ){
	setContent(oJSJaCPacket.getBody());
  }
}

function handlePresence(oJSJaCPacket) {
  /*var html = '<div class="msg">';
  if (!oJSJaCPacket.getType() && !oJSJaCPacket.getShow())
    html += '<b>'+oJSJaCPacket.getFromJID()+' has become available.</b>';
  else {
    html += '<b>'+oJSJaCPacket.getFromJID()+' has set his presence to ';
    if (oJSJaCPacket.getType())
      html += oJSJaCPacket.getType() + '.</b>';
    else
      html += oJSJaCPacket.getShow() + '.</b>';
    if (oJSJaCPacket.getStatus())
      html += ' ('+oJSJaCPacket.getStatus().htmlEnc()+')';
  }
  html += '</div>';

  document.getElementById('iResp').innerHTML += html;
  document.getElementById('iResp').lastChild.scrollIntoView();
  */
}

function handleError(e) {
  document.getElementById('err').innerHTML = "An error occured:<br />"+
    ("Code: "+e.getAttribute('code')+"\nType: "+e.getAttribute('type')+
    "\nCondition: "+e.firstChild.nodeName).htmlEnc();
  document.getElementById('login_pane').style.display = '';
  document.getElementById('sendmsg_pane').style.display = 'none';

  if (con.connected()) con.disconnect();
}

function handleStatusChanged(status) {
  //oDbg.log("status changed: "+status);
}

function handleConnected() {
  document.getElementById('login_pane').style.display = 'none';
  document.getElementById('err').innerHTML = '';

  con.send(new JSJaCPresence());
}

function handleDisconnected() {
  document.getElementById('login_pane').style.display = '';
}

function handleIqVersion(iq) {
  con.send(iq.reply([
                     iq.buildNode('name', 'jsjac simpleclient'),
                     iq.buildNode('version', JSJaC.Version),
                     iq.buildNode('os', navigator.userAgent)
                     ]));
  return true;
}

function handleIqTime(iq) {
  var now = new Date();
  con.send(iq.reply([iq.buildNode('display',  now.toLocaleString()),
                     iq.buildNode('utc',  now.jabberDate()),
                     iq.buildNode('tz', now.toLocaleString().substring(now.toLocaleString().lastIndexOf(' ')+1))
                     ]));
  return true;
}

function doLogin(oForm) {
  document.getElementById('err').innerHTML = ''; // reset
  document.getElementById('status_panel').innerHTML = "未登录";

  try {
    if (HTTP_BIND_URL.substr(0, 5) === 'ws://' || HTTP_BIND_URL.substr(0, 6) === 'wss://') {
      con = new JSJaCWebSocketConnection({httpbase: HTTP_BIND_URL, oDbg: new JSJaCConsoleLogger(4)});
    } else {
      con = new JSJaCHttpBindingConnection({httpbase: HTTP_BIND_URL, oDbg: new JSJaCConsoleLogger(4)});
    }

    setupCon(con);

    // setup args for connect method
    oArgs = new Object();
    oArgs.domain = oForm.server.value;
    oArgs.username = oForm.username.value;
    oArgs.resource = XMPP_RESOURCE;
    oArgs.pass = oForm.password.value;
    // oArgs.register = oForm.register.checked;
    con.connect(oArgs);
	document.getElementById('status_panel').innerHTML = "已登录："+con.username;
 	document.getElementById('tools_panel').style.display = '';
 } catch (e) {
    document.getElementById('err').innerHTML = e.toString();
	document.getElementById('tools_panel').style.display = 'none';
  } finally {
    return false;
  }
}

function setupCon(oCon) {
    oCon.registerHandler('message',handleMessage);
    oCon.registerHandler('presence',handlePresence);
    oCon.registerHandler('iq',handleIQ);
    oCon.registerHandler('onconnect',handleConnected);
    oCon.registerHandler('onerror',handleError);
    oCon.registerHandler('status_changed',handleStatusChanged);
    oCon.registerHandler('ondisconnect',handleDisconnected);

    oCon.registerIQGet('query', NS_VERSION, handleIqVersion);
    oCon.registerIQGet('query', NS_TIME, handleIqTime);
}

function quit() {
  var p = new JSJaCPresence();
  p.setType("unavailable");
  con.send(p);
  con.disconnect();

  document.getElementById('login_pane').style.display = '';
  document.getElementById('sendmsg_pane').style.display = 'none';
}

onload = function () {
  try { // try to resume a session
    con = new JSJaCHttpBindingConnection({'oDbg': new JSJaCConsoleLogger(4)});

    setupCon(con);

    if (con.resume()) {
      document.getElementById('login_pane').style.display = 'none';
      document.getElementById('sendmsg_pane').style.display = '';
      document.getElementById('err').innerHTML = '';
	  document.getElementById('status_panel').innerHTML = "已登录："+con.username;
    }
  } catch (e) {} // reading cookie failed - never mind

}

//onerror = function(e) {
//  document.getElementById('err').innerHTML = e;
//
//  document.getElementById('login_pane').style.display = '';
//  document.getElementById('sendmsg_pane').style.display = 'none';
//
//  if (con && con.connected())
//    con.disconnect();
//  return false;
//};

onunload = function() {
  if (typeof con != 'undefined' && con && con.connected()) {
  // save backend type
    if (con._hold) // must be binding
      (new JSJaCCookie('btype','binding')).write();
    else
      (new JSJaCCookie('btype','polling')).write();
    if (con.suspend) {
      con.suspend();
    }
  }
};

function setContent(url) {
	document.getElementById('content_panel').innerHTML = "<img src='"+url+"' width='800'>";
}


