var sfs = null;

function init()
{
	trace("Application started");

	// Create configuration object
	var config = {};
	config.host = "127.0.0.1";
	config.port = 8080;
	config.zone = "BasicExamples";
	config.debug = true;
	config.useSSL = false;

	// Create SmartFox client instance
	sfs = new SFS2X.SmartFox(config);

	// Set logging
	sfs.logger.level = SFS2X.LogLevel.DEBUG;
	sfs.logger.enableConsoleOutput = true;
	sfs.logger.enableEventDispatching = false;

	sfs.logger.addEventListener(SFS2X.LoggerEvent.DEBUG, onDebugLogged, this);
	sfs.logger.addEventListener(SFS2X.LoggerEvent.INFO, onInfoLogged, this);
	sfs.logger.addEventListener(SFS2X.LoggerEvent.WARNING, onWarningLogged, this);
	sfs.logger.addEventListener(SFS2X.LoggerEvent.ERROR, onErrorLogged, this);

	// Add event listeners
	sfs.addEventListener(SFS2X.SFSEvent.CONNECTION, onConnection, this);
	sfs.addEventListener(SFS2X.SFSEvent.CONNECTION_LOST, onConnectionLost, this);
	sfs.addEventListener(SFS2X.SFSEvent.LOGIN_ERROR, onLoginError, this);
	sfs.addEventListener(SFS2X.SFSEvent.LOGIN, onLogin, this);
	sfs.addEventListener(SFS2X.SFSEvent.LOGOUT, onLogout, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_JOIN_ERROR, onRoomJoinError, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_JOIN, onRoomJoin, this);
	sfs.addEventListener(SFS2X.SFSEvent.USER_COUNT_CHANGE, onUserCountChange, this);
	sfs.addEventListener(SFS2X.SFSEvent.USER_ENTER_ROOM, onUserEnterRoom, this);
	sfs.addEventListener(SFS2X.SFSEvent.USER_EXIT_ROOM, onUserExitRoom, this);
	sfs.addEventListener(SFS2X.SFSEvent.PUBLIC_MESSAGE, onPublicMessage, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_VARIABLES_UPDATE, onRoomVariablesUpdate, this);
	sfs.addEventListener(SFS2X.SFSEvent.USER_VARIABLES_UPDATE, onUserVariablesUpdate, this);
}

//------------------------------------
// USER INTERFACE HANDLERS
//------------------------------------

function onConnectBtClick()
{
	// Connect to SFS
	// As no parameters are passed, the config object is used
	sfs.connect();

	// Disable button
	enableButton("#connectBt", false);
}

function onLoginBtClick()
{
	// Perform login
	var uName = $("#usernameIn").val();
	var isSent = sfs.send(new SFS2X.LoginRequest(uName));
	
	// Disable interface
	if (isSent)
	{
		enableTextField("#usernameIn", false);
		enableButton("#loginBt", false);
	}
}

function onLogoutBtClick()
{
	var isSent = sfs.send(new SFS2X.LogoutRequest());

	if (isSent)
		enableButton("#logoutBt", false);
}

function onDisconnectBtClick()
{
	// Disconnect from SFS
	sfs.disconnect();

	// Disable button
	enableButton("#disconnectBt", false);
}

function onRoomSelected(event)
{
	var args = event.args;
    var item = $("#roomList").jqxListBox("getItem", args.index);
	var room = item.originalItem.roomObj;

	// Join selected room
	if (sfs.lastJoinedRoom == null || room.id != sfs.lastJoinedRoom.id)
		sfs.send(new SFS2X.JoinRoomRequest(room));
}

function onSendPublicMessageBtClick(event)
{
	var isSent = sfs.send(new SFS2X.PublicMessageRequest($("#publicMsgIn").val()));

	if (isSent)
		$("#publicMsgIn").val("");
}

function onSetTopicBtClick(event)
{
	// Set a Room Variable containing the chat topic
	// Null is used to delete the Room Variable
	var topic = $("#roomTopicIn").val() != "" ? $("#roomTopicIn").val() : null;
	var roomVar = new SFS2X.SFSRoomVariable("topic", topic);

	sfs.send(new SFS2X.SetRoomVariablesRequest([roomVar]));
}

function onSetUserNickBtClick(event)
{
	// Set a User Variable containing the user nickname
	// Null is used to delete the User Variable
	var nick = $("#userNickIn").val() != "" ? $("#userNickIn").val() : null;
	var userVar = new SFS2X.SFSUserVariable("nick", nick);

	var isSent = sfs.send(new SFS2X.SetUserVariablesRequest([userVar]));

	if (isSent)
		$("#userNickIn").val("");
}

//------------------------------------
// LOGGER EVENT HANDLERS
//------------------------------------

// The dispatched logging messages should be printed in a dedicated debug panel in the application interface
// (because the logger already prints to the console on its own, unless console output is deactivated)

function onDebugLogged(event)
{
	console.log("DEBUG MESSAGE DISPATCHED:\n" + event.message);
}

function onInfoLogged(event)
{
	console.log("INFO MESSAGE DISPATCHED:\n" + event.message);
}

function onWarningLogged(event)
{
	console.log("WARNING MESSAGE DISPATCHED:\n" + event.message);
}

function onErrorLogged(event)
{
	console.log("ERROR MESSAGE DISPATCHED:\n" + event.message);
}

//------------------------------------
// SFS EVENT HANDLERS
//------------------------------------

function onConnection(event)
{
	if (event.success)
	{
		trace("Connected to SmartFoxServer 2X!");

		// Enable interface
		enableTextField("#usernameIn", true);
		enableButton("#loginBt", true);
		enableButton("#disconnectBt", true);
	}
	else
	{
		trace("Connection failed: " + (event.errorMessage ? event.errorMessage + " (" + event.errorCode + ")" : "Is the server running at all?"), true);

		// Enable button
		enableButton("#connectBt", true);
	}
}

function onConnectionLost(event)
{
	trace("I was disconnected; reason is: " + event.reason);

	// Disable interface
	enableTextField("#usernameIn", false);
	enableButton("#loginBt", false);
	enableButton("#logoutBt", false);
	enableButton("#disconnectBt", false);
	enableTextField("#userNickIn", false);
	enableButton("#setUserNickBt", false);

	enableButton("#connectBt", true);

	// Empty room & user lists
	$("#roomList").jqxListBox("clear");
	$("#userList").jqxListBox("clear");

	// Clear and disable chat area
	enableChatArea(false, true);
}

function onLoginError(event)
{
	trace("Login error: " + event.errorMessage + " (" + event.errorCode + ")", true);

	// Enable interface
	enableTextField("#usernameIn", true);
	enableButton("#loginBt", true);
}

function onLogin(event)
{
	trace("Login successful!" +
		  "\n\tZone: " + event.zone +
		  "\n\tUser: " + event.user +
		  "\n\tData: " + event.data);

	// Enable interface
	enableButton("#logoutBt", true);

	// Set user name
	$("#usernameIn").val(event.user.name);

	// Populate rooms list
	populateRoomsList();

	enableTextField("#userNickIn", true);
	enableButton("#setUserNickBt", true);
}

function onLogout(event)
{
	trace("Logout from zone " + event.zone + " performed!");

	// Enable login interface
	enableTextField("#usernameIn", true);
	enableButton("#loginBt", true);

	// Disable interface
	enableChatArea(false, true);
	enableTextField("#userNickIn", false);
	enableButton("#setUserNickBt", false);

	// Empty room & user lists
	$("#roomList").jqxListBox("clear");
	$("#userList").jqxListBox("clear");
}

function onRoomJoinError(event)
{
	trace("Room join error: " + event.errorMessage + " (" + event.errorCode + ")", true);

	// Reset roomlist selection
	if (sfs.lastJoinedRoom != null)
	{
		var index = searchRoomList(sfs.lastJoinedRoom.id);
		$("#roomList").jqxListBox("selectIndex", index);
	}
	else
		$("#roomList").jqxListBox("clearSelection");
}

function onRoomJoin(event)
{
	trace("Room joined: " + event.room);

	// Enable interface
	enableChatArea(true, true);

	writeToChatArea("<em>You entered room '" + event.room.name + "'</em>");

	showRoomTopic(event.room);

	// Populate users list
	populateUsersList();
}

function onUserCountChange(event)
{
	// For example code simplicity we rebuild the full roomlist instead of just updating the specific item
	populateRoomsList();
}

function onUserEnterRoom(event)
{
	writeToChatArea("<em>User " + event.user.name + " (" + event.user.id + ") entered the room</em>");

	// For example code simplicity we rebuild the full userlist instead of just adding the specific item
	populateUsersList();
}

function onUserExitRoom(event)
{
	if (!event.user.isItMe)
		writeToChatArea("<em>User " + event.user.name + " (" + event.user.id + ") left the room</em>");

	// For example code simplicity we rebuild the full userlist instead of just removing the specific item
	populateUsersList();
}

function onPublicMessage(event)
{
	var sender = (event.sender.isItMe ? "You" : event.sender.name);
	var nick = event.sender.getVariable("nick");
	var aka = (!event.sender.isItMe && nick != null ? " (aka '" + nick.value + "')" : "");
	writeToChatArea("<b>" + sender + aka + " said:</b><br/>" + event.message);
}

function onRoomVariablesUpdate(event)
{
	// Check if the 'topic' variable was set/updated
	if (event.changedVars.indexOf("topic") > -1)
	{
		var deleted = !event.room.containsVariable("topic");
		showRoomTopic(event.room, deleted);
	}
}

function onUserVariablesUpdate(event)
{
	// Check if the 'nick' variable was set/updated
	if (event.changedVars.indexOf("nick") > -1)
	{
		// For code simplicity we rebuild the full userlist instead of just editing the specific item
		populateUsersList();
	}
}

//------------------------------------
// OTHER METHODS
//------------------------------------

function trace(txt, showAlert)
{
	console.log(txt);

	if (showAlert)
		alert(txt);
}

function enableButton(id, doEnable)
{
	$(id).jqxButton({disabled:!doEnable});
}

function enableTextField(id, doEnable)
{
	if (doEnable)
		$(id).removeAttr("disabled");
	else
		$(id).attr("disabled", true);
}

function enableChatArea(doEnable, clear)
{
	if (clear)
	{
		$("#chatAreaPn").jqxPanel("clearcontent");
		$("#publicMsgIn").val("");
		showRoomTopic();
	}

	$("#chatAreaPn").jqxPanel({disabled:!doEnable});

	enableTextField("#publicMsgIn", doEnable);
	enableButton("#sendMsgBt", doEnable);

	enableTextField("#roomTopicIn", doEnable);
	enableButton("#setTopicBt", doEnable);
}

function populateRoomsList()
{
	var rooms = sfs.roomManager.getRoomList();
	var index = 0;
	var selectedIndex = -1;
	var source = [];

	for (var r in rooms)
	{
		var room = rooms[r];

		var item = {};
		item.html = "<div><p class='itemTitle'><strong>" + room.name + "</strong>" + (room.isPasswordProtected ? " <img src='images/lock.png'/>" : "") + "</p>" +
					"<p class='itemSub'>Users: " + room.userCount + "/" + room.maxUsers + "</p></div>";
		item.title = room.name;
		item.roomObj = room;

		source.push(item);

		if (sfs.lastJoinedRoom != null && room.id == sfs.lastJoinedRoom.id)
			selectedIndex = index;

		index++;
	}

	$("#roomList").jqxListBox({source: source, selectedIndex: selectedIndex});
}

function populateUsersList()
{
	var source = [];
	var index = 0;
	var selectedIndex = -1;

	if (sfs.lastJoinedRoom != null)
	{
		var users = sfs.lastJoinedRoom.getUserList();

		for (var u in users)
		{
			var user = users[u];

			var item = {};
			item.html = "<div><p class='itemTitle'><strong>" + user.name + "</strong>" + (user.isItMe ? " (you)" : "") + "</p>";

			if (user.containsVariable("nick"))
				item.html += "<p class='itemSub'>Nickname: <strong>" + user.getVariable("nick").value + "</strong></p>";

			item.html += "</div>";

			item.title = user.name;
			item.userObj = user;

			source.push(item);

			index++;
		}
	}

	// Populate list
	$("#userList").jqxListBox({source: source});
}

function searchRoomList(roomId)
{
	var items = $("#roomList").jqxListBox("source");

	for (var i = 0; i < items.length; i++)
	{
		var room = items[i].roomObj;

		if (room.id == roomId)
			return i;
	}

	return -1;
}

function writeToChatArea(text)
{
	$("#chatAreaPn").jqxPanel("append", "<p class='chatAreaElement'>" + text + "</p>");

	// Set chat area scroll position
	$("#chatAreaPn").jqxPanel("scrollTo", 0, $("#chatAreaPn").jqxPanel("getScrollHeight"));
}

function writeToPrivateChatArea(text)
{
	$("#privChatAreaPn").jqxPanel("append", "<p class='chatAreaElement'>" + text + "</p>");

	// Set chat area scroll position
	$("#privChatAreaPn").jqxPanel("scrollTo", 0, $("#privChatAreaPn").jqxPanel("getScrollHeight"));
}

function showRoomTopic(room, deleted)
{
	// Show topic if corresponding room variable is set
	if (room != null)
	{
		if (deleted)
			writeToChatArea("<em>Room topic removed</em>");
		else
		{
			if (room.containsVariable("topic"))
			{
				var roomVar = room.getVariable("topic");

				if (!roomVar.isNull)
				{
					$("#chatTopicLb").html("Topic is '" + roomVar.value + "'");
					$("#roomTopicIn").val(roomVar.value);

					writeToChatArea("<em>Room topic set to '" + roomVar.value + "'</em>");

					return;
				}
			}
		}
	}

	// Hide topic if null room is passed or no room variable is set or variable is null
	$("#chatTopicLb").html("");
	$("#roomTopicIn").val("");
}
