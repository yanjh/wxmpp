/* XMPP fro tearcher*/

var HTTP_BIND_URL = "http://192.168.0.90/http-bind/";
var HTTP_BASE_URL = "http://192.168.0.90/courses/c1/";
var XMPP_TIMEOUT = 4000;
var XMPP_DOMAIN = "im.cd";
var XMPP_RESOURCE = "Teacher_Web";
var XMPP_SUBJECT_CONTENT = "Content";
var XMPP_SUBJECT_NAVIGATION = "Navigation";
var XMPP_SUBJECT_MESSAGE = "Message";
var XMPP_CHAT_ROOM = "c1@conference.im.cd/teacher1";

var curent_index=1;

function doLogin(oForm) {
  logInfo('');
  try {
    if (HTTP_BIND_URL.substr(0, 5) === 'ws://' || HTTP_BIND_URL.substr(0, 6) === 'wss://') {
      con = new JSJaCWebSocketConnection({httpbase: HTTP_BIND_URL,   oDbg: new JSJaCConsoleLogger(4)});
    } else {
      con = new JSJaCHttpBindingConnection({httpbase: HTTP_BIND_URL, oDbg: new JSJaCConsoleLogger(4)});
    }

    setupCon(con);

    // setup args for connect method
    oArgs = new Object();
	oArgs.timerval = XMPP_TIMEOUT;
    oArgs.domain = oForm.server.value;
    oArgs.username = oForm.username.value;
    oArgs.resource = XMPP_RESOURCE;
    oArgs.pass = oForm.password.value;
    // oArgs.register = oForm.register.checked;
    con.connect(oArgs);

	logInfo('信息:已登录-'+con.username);
	showPanel(2);
	chatRoom(); //ready chatroom
	goFirst();
  } catch (e) {
	logInfo('错误:'+e.toString());
	if (!con.connected()) showPanel(1);
  } finally {
    return false;
  }
}

function logInfo(sInfo) {
	if(sInfo=='') document.getElementById('info_panel').innerHTML = '';
	document.getElementById('info_panel').innerHTML += sInfo+"<br>";
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

function showPanel(show) {
	if (show==1) { // login
	  document.getElementById('login_panel').style.display = '';
	  document.getElementById('sendmsg_panel').style.display = 'none';	
	  document.getElementById('tool_panel').style.display = 'none';	
	  document.getElementById('content_panel').style.display = 'none';	
	} else if (show==2) { //normal
	  document.getElementById('login_panel').style.display = 'none';
	  document.getElementById('sendmsg_panel').style.display = '';	
	  document.getElementById('tool_panel').style.display = '';	
	  document.getElementById('content_panel').style.display = '';	
	} else {
	
	}
}

function handleIQ(oIQ) {
  /*document.getElementById('iResp').innerHTML +="<div class='msg'>IN (raw): " +oIQ.xml().htmlEnc() + '</div>';
  document.getElementById('iResp').lastChild.scrollIntoView();
  con.send(oIQ.errorReply(ERR_FEATURE_NOT_IMPLEMENTED));
  */
}

function handleMessage(oJSJaCPacket) {
  subject=oJSJaCPacket.getSubject();
  
  if (XMPP_SUBJECT_CONTENT == subject) {
  
  } else if (XMPP_SUBJECT_NAVIGATION == subject) {

  } else if (XMPP_SUBJECT_MESSAGE == subject) {
	  var msg = '消息:'+oJSJaCPacket.getFromJID()+'-'+oJSJaCPacket.getBody().htmlEnc();
	  logInfo(msg);
  }
}

function handlePresence(oJSJaCPacket) {
  var html = '状态:';
  if (!oJSJaCPacket.getType() && !oJSJaCPacket.getShow())
    html += oJSJaCPacket.getFromJID()+' 可用';
  else {
    html += oJSJaCPacket.getFromJID()+' 设置为';
    if (oJSJaCPacket.getType())
      html += oJSJaCPacket.getType() ;
    else
      html += oJSJaCPacket.getShow() ;
    if (oJSJaCPacket.getStatus())
      html += ' ('+oJSJaCPacket.getStatus().htmlEnc()+')';
  }
  logInfo(html);
}

function handleError(e) {
  var html = "错误:"+e.toString();
  logInfo(html);
  if (con.connected()) con.disconnect();
}

function handleStatusChanged(status) {
  logInfo("状态:改变为"+status);
}

function handleConnected() {
  showPanel(2);
}

function handleDisconnected() {
  showPanel(1);
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

function goFirst() {
	current_index=1;
	setContent(current_index);
}

function goNext() {
	current_index++;
	setContent(current_index);
}  

function goPrev() {
	if (current_index>1) {
		current_index--;
		setContent(current_index);
	}
}  

function getName(i) {
	if (i<10)  return "00"+i+".jpg";
	if (i<100) return "0" +i+".jpg";
	return i+".jpg";
}

function setContent(current_index) {
	url=HTTP_BASE_URL+getName(current_index);
	document.getElementById('content_panel').innerHTML = "<img src='"+url+"' width='800'>";
	sendContentMsg(url);
}

function sendContentMsg(url) {
  sendTo="s1";
  if (url == '')  return false;
  if (sendTo.indexOf('@') == -1) sendTo += '@' + con.domain;

  try {
    var oMsg = new JSJaCMessage();
    oMsg.setTo(new JSJaCJID(sendTo));
	oMsg.setSubject(XMPP_SUBJECT_CONTENT);
    oMsg.setBody(url);
    con.send(oMsg);

    return true;
  } catch (e) {
    logInfo("错误"+e.message);
    return false;
  }
}

function chatRoom(){

	if (typeof con != 'undefined' && con && con.connected) 
	  try {
	    logInfo("信息:登录聊天室...");
		var packet = new JSJaCPresence();
		packet.setTo(XMPP_CHAT_ROOM);
		packet.appendNode('x', {xmlns: "http://jabber.org/protocol/muc"},
							[["password", "hello"]]);

		con.send(packet);

		return true;
	  } catch (e) {
		logInfo("错误:chatRoom登录失败"+e.message);
		return false;
	  }
}

function sendMsg(oForm) {
  var sendTo=XMPP_CHAT_ROOM;

  try {
    var oMsg = new JSJaCMessage();
    oMsg.setTo(new JSJaCJID(sendTo));
	oMsg.setType('groupchat');
    oMsg.setBody(oForm.msg.value);
    con.send(oMsg);
	
    oForm.msg.value = '';
    return true;
  } catch (e) {
    logInfo("错误:消息发送-"+e.message);
    oForm.msg.value = '';
    return false;
  }
}


function IsValidImageUrl(url) {
	return true;
}
  
function quit() {
  var p = new JSJaCPresence();
  p.setType("unavailable");
  con.send(p);
  con.disconnect();
  showPenel(1);

}

onload = function () {
  logInfo(""); 
  try { // try to resume a session
    con = new JSJaCHttpBindingConnection({'oDbg': new JSJaCConsoleLogger(4)});
    setupCon(con);

    if (con.resume()) {
	  showPanel(2);
	  logInfo("信息:已登录-"+con.username);
    }
  } catch (e) {
  
  
  } // reading cookie failed - never mind

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
    
	if (con.suspend) con.suspend();
  }
};


