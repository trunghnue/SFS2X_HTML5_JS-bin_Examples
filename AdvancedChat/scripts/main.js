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
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_REMOVE, onRoomRemove, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_CREATION_ERROR, onRoomCreationError, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_ADD, onRoomAdd, this);
	sfs.addEventListener(SFS2X.SFSEvent.PUBLIC_MESSAGE, onPublicMessage, this);
	sfs.addEventListener(SFS2X.SFSEvent.PRIVATE_MESSAGE, onPrivateMessage, this);
	sfs.addEventListener(SFS2X.SFSEvent.MODERATOR_MESSAGE, onModeratorMessage, this);
	sfs.addEventListener(SFS2X.SFSEvent.ADMIN_MESSAGE, onAdminMessage, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_VARIABLES_UPDATE, onRoomVariablesUpdate, this);
	sfs.addEventListener(SFS2X.SFSEvent.USER_VARIABLES_UPDATE, onUserVariablesUpdate, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_NAME_CHANGE, onRoomNameChange, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_NAME_CHANGE_ERROR, onRoomNameChangeError, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_PASSWORD_STATE_CHANGE, onRoomPasswordStateChange, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_PASSWORD_STATE_CHANGE_ERROR, onRoomPasswordStateChangeError, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_CAPACITY_CHANGE, onRoomCapacityChange, this);
	sfs.addEventListener(SFS2X.SFSEvent.ROOM_CAPACITY_CHANGE_ERROR, onRoomCapacityChangeError, this);
	sfs.addEventListener(SFS2X.SFSEvent.PING_PONG, onPingPong, this);
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

	if (sfs.lastJoinedRoom == null || room.id != sfs.lastJoinedRoom.id)
	{
		// If Room is private (password protected), show a popup requesting the password...
		if (room.isPasswordProtected)
		{
			$("#roomIdIn").val(room.id);
			$("#enterPasswordWin").jqxWindow("open");
		}

		// ...otherwise immediately join the selected Room
		else
			sfs.send(new SFS2X.JoinRoomRequest(room));
	}
}

function onEnterPasswordClosed(event)
{
	// Clear fields
	$("#joinPwdIn").val("");
	$("#roomIdIn").val("");

	// Reset Room selection
	resetRoomListSelection();
}

function onDoJoinRoomBtClick(event)
{
	var roomId = Number($("#roomIdIn").val());

	// Retrieve Room object
	var room = sfs.getRoomById(roomId);

	if (room != null)
	{
		var password = $("#joinPwdIn").val();

		// Send JoinRoom request
		sfs.send(new SFS2X.JoinRoomRequest(room, password));
	}

	// Hide window
	// (fields will be cleared by the onEnterPasswordClosed method, called automatically)
	$("#enterPasswordWin").jqxWindow("hide");
}

function onLeaveRoomBtClick(event)
{
	var isSent = sfs.send(new SFS2X.LeaveRoomRequest(sfs.lastJoinedRoom));

	if (isSent)
	{
		enableChatArea(false, true);
		enableRoomControls(false);
		$("#roomList").jqxListBox("clearSelection");
	}
}

function onCreateRoomBtClick(event)
{
	// Show create Room window
	$("#createRoomWin").jqxWindow("open");
}

function onDoCreateRoomBtClick(event)
{
	var autoJoin = $("#autoJoinCb").jqxCheckBox("checked");

	var roomSettings = new SFS2X.RoomSettings($("#roomNameIn").val());
	roomSettings.password = $("#passwordIn").val();
	roomSettings.maxUsers = Number($("#maxUsersIn").jqxNumberInput("decimal"));

	var permissions = new SFS2X.RoomPermissions();
	permissions.allowNameChange = $("#isNameChangeAllowedCb").jqxCheckBox("checked");
	permissions.allowPasswordStateChange = $("#isPwdStateChangeAllowedCb").jqxCheckBox("checked");
	permissions.allowPublicMessages = $("#isPublicMessageAllowedCb").jqxCheckBox("checked");
	permissions.allowResizing = $("#isResizeAllowedCb").jqxCheckBox("checked");
	roomSettings.permissions = permissions;

	// Send CreateRoom request
	var isSent = sfs.send(new SFS2X.CreateRoomRequest(roomSettings, autoJoin, sfs.lastJoinedRoom));

	if (isSent)
	{
		// Hide window
		$("#createRoomWin").jqxWindow("hide");
		$("#createRoomWinTabs").jqxTabs("select", 0);

		// Clear fields
		$("#roomNameIn").val("");
		$("#passwordIn").val("");
		$("#maxUsersIn").jqxNumberInput({decimal:10});

		$("#isNameChangeAllowedCb").jqxCheckBox({checked:true});
		$("#isPwdStateChangeAllowedCb").jqxCheckBox({checked:true});
		$("#isPublicMessageAllowedCb").jqxCheckBox({checked:true});
		$("#isResizeAllowedCb").jqxCheckBox({checked:true});
	}
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

function onSetRoomNameBtClick(event)
{
	var isSent = sfs.send(new SFS2X.ChangeRoomNameRequest(sfs.lastJoinedRoom, $("#newRoomNameIn").val()));

	if (isSent)
		$("#newRoomNameIn").val("");
}

function onSetRoomPwdBtClick(event)
{
	var isSent = sfs.send(new SFS2X.ChangeRoomPasswordStateRequest(sfs.lastJoinedRoom, $("#newPasswordIn").val()));

	if (isSent)
		$("#newPasswordIn").val("");
}

function onSetRoomSizeBtClick(event)
{
	var newMaxUsers = Number($("#newRoomSizeIn").jqxNumberInput("decimal"));
	var isSent = sfs.send(new SFS2X.ChangeRoomCapacityRequest(sfs.lastJoinedRoom, newMaxUsers, 0));

	if (isSent)
		$("#newRoomSizeIn").jqxNumberInput({decimal:10});
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

function onUserSelected(event)
{
	var args = event.args;
	var selectionType = args.type;

	// Only consider user selection made using mouse or keyboard (API call is excluded)
	if (selectionType != "none")
	{
    	var item = $("#userList").jqxListBox("getItem", args.index);
		var user = item.originalItem.userObj;

		// Enable private chat
		if (currentPrivateChat != user.id)
			enablePrivateChat(user.id);

		// For example code simplicity we rebuild the full userlist instead of just editing the specific item
		// This causes # of PM to read being updated
		populateUsersList();
	}
}

function onSendPrivateMessageBtClick(event)
{
	var params = new SFS2X.SFSObject();
	params.putInt("recipient", currentPrivateChat);

	var isSent = sfs.send(new SFS2X.PrivateMessageRequest($("#privateMsgIn").val(), currentPrivateChat, params));

	if (isSent)
		$("#privateMsgIn").val("");
}

function onDeselectUserBtClick(event)
{
	enablePrivateChat(-1);
}

function onKickBtClick(event)
{
	if (currentPrivateChat > -1)
		sfs.send(new SFS2X.KickUserRequest(currentPrivateChat, "Think about your behavior and come back later, you are kicked!"));
}

function onBanBtClick(event)
{
	if (currentPrivateChat > -1)
		sfs.send(new SFS2X.BanUserRequest(currentPrivateChat, "Time for some vacation... you are banned!", SFS2X.BanMode.BY_NAME));
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
	// Disable interface
	enableTextField("#usernameIn", false);
	enableButton("#loginBt", false);
	enableButton("#logoutBt", false);
	enableButton("#disconnectBt", false);
	enableButton("#createRoomBt", false);
	enableRoomControls(false);
	enableTextField("#userNickIn", false);
	enableButton("#setUserNickBt", false);
	enablePrivateChat(-1);

	enableButton("#connectBt", true);

	// Empty Room & user lists
	$("#roomList").jqxListBox("clear");
	$("#userList").jqxListBox("clear");

	// Clear and disable chat area
	enableChatArea(false, true);

	// Hide popup panels if open
	$("#createRoomWin").jqxWindow("hide");
	$("#enterPasswordWin").jqxWindow("hide");
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
	enableButton("#createRoomBt", true);

	// Set user name
	$("#usernameIn").val(event.user.name);

	// Populate Rooms list
	populateRoomsList();

	currentPrivateChat = -1;
	privateChats = [];
	enableTextField("#userNickIn", true);
	enableButton("#setUserNickBt", true);

	sfs.enableLagMonitor(true, 5);
}

function onLogout(event)
{
	trace("Logout from zone " + event.zone + " performed!");

	// Enable login interface
	enableTextField("#usernameIn", true);
	enableButton("#loginBt", true);

	// Disable interface
	enableChatArea(false, true);
	enableButton("#createRoomBt", false);
	enableRoomControls(false);
	enableTextField("#userNickIn", false);
	enableButton("#setUserNickBt", false);
	enablePrivateChat(-1);
	$("#lagLb").text("&nbsp;");

	// Empty Room & user lists
	$("#roomList").jqxListBox("clear");
	$("#userList").jqxListBox("clear");
}

function onRoomJoinError(event)
{
	trace("Room join error: " + event.errorMessage + " (" + event.errorCode + ")", true);

	// Reset roomlist selection
	resetRoomListSelection();
}

function onRoomJoin(event)
{
	trace("Room joined: " + event.room);

	// Enable interface
	enableChatArea(true, true);
	enableRoomControls(true);

	writeToChatArea("<em>You entered Room '" + event.room.name + "'</em>");

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
	writeToChatArea("<em>User " + event.user.name + " (" + event.user.id + ") entered the Room</em>");

	// For example code simplicity we rebuild the full userlist instead of just adding the specific item
	populateUsersList();
}

function onUserExitRoom(event)
{
	if (!event.user.isItMe)
		writeToChatArea("<em>User " + event.user.name + " (" + event.user.id + ") left the Room</em>");

	// For example code simplicity we rebuild the full userlist instead of just removing the specific item
	populateUsersList();

	// Disable private chat
	if (event.user.isItMe || event.user.id == currentPrivateChat)
		enablePrivateChat(-1);
}

function onRoomRemove(event)
{
	// Hide password popup window if the Room was removed while the user is trying to join it
	if (event.room.id == Number($("#roomIdIn").val()))
		$("#enterPasswordWin").jqxWindow("hide");

	// For example code simplicity we rebuild the full roomlist instead of just removing the item
	populateRoomsList();
}

function onRoomCreationError(event)
{
	trace("Room create error: " + event.errorMessage + " (" + event.errorCode + ")", true);
}

function onRoomAdd(event)
{
	trace("Room added: " + event.room);

	// For example code simplicity we rebuild the full roomlist instead of just adding the new item
	populateRoomsList();
}

function onPublicMessage(event)
{
	var sender = (event.sender.isItMe ? "You" : event.sender.name);
	var nick = event.sender.getVariable("nick");
	var aka = (!event.sender.isItMe && nick != null ? " (aka '" + nick.value + "')" : "");
	writeToChatArea("<b>" + sender + aka + " said:</b><br/>" + event.message);
}

function onPrivateMessage(event)
{
	var user;

	if (event.sender.isItMe)
	{
		var userId = event.data.get("recipient"); // "data" is an SFSObject
		user = sfs.userManager.getUserById(userId);
	}
	else
		user = event.sender;

	if (privateChats[user.id] == null)
		privateChats[user.id] = {queue:[], toRead:0};

	var message = "<b>" + (event.sender.isItMe ? "You" : event.sender.name) + " said:</b> " + event.message;
	privateChats[user.id].queue.push(message);

	if (currentPrivateChat == user.id)
		writeToPrivateChatArea(message);
	else
	{
		privateChats[user.id].toRead += 1;

		// For code simplicity we rebuild the full userlist instead of just editing the specific item
		// This causes # of PM to read being displayed
		populateUsersList();
	}
}

function onModeratorMessage(event)
{
	writeToChatArea("<em class='mod'>Message from <b>Moderator " + event.sender.name + ":</b><br/>" + event.message + "</em>");
}

function onAdminMessage(event)
{
	writeToChatArea("<em class='admin'>Message from <b>Administrator " + event.sender.name + ":</b><br/>" + event.message + "</em>");
}

function onRoomVariablesUpdate(event)
{
	// Check if the 'topic' Room Variable was set/updated
	if (event.changedVars.indexOf("topic") > -1)
	{
		var deleted = !event.room.containsVariable("topic");
		showRoomTopic(event.room, deleted);
	}
}

function onUserVariablesUpdate(event)
{
	// Check if the 'nick' User Variable was set/updated
	if (event.changedVars.indexOf("nick") > -1)
	{
		// For code simplicity we rebuild the full userlist instead of just editing the specific item
		populateUsersList();
	}
}

function onRoomNameChangeError(event)
{
	trace("Room name change error: " + event.errorMessage + " (" + event.errorCode + ")", true);
}

function onRoomNameChange(event)
{
	// For code simplicity we rebuild the full roomlist instead of just editing the specific item
	populateRoomsList();

	if (event.room == sfs.lastJoinedRoom)
		writeToChatArea("<em>Room name changed from '" + event.oldName + "' to '" + event.room.name + "'</em>");
}

function onRoomPasswordStateChangeError(event)
{
	trace("Room password change error: " + event.errorMessage + " (" + event.errorCode + ")", true);
}

function onRoomPasswordStateChange(event)
{
	// For code simplicity we rebuild the full roomlist instead of just editing the specific item
	// A lock icon appears or disappears
	populateRoomsList();
}

function onRoomCapacityChangeError(event)
{
	trace("Room capacity change error: " + event.errorMessage + " (" + event.errorCode + ")", true);
}

function onRoomCapacityChange(event)
{
	// For code simplicity we rebuild the full roomlist instead of just editing the specific item
	populateRoomsList();
}

function onPingPong(event)
{
	var avgLag = Math.round(event.lagValue * 100) / 100;
	$("#lagLb").text("Average lag: " + avgLag + "ms");
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

function enablePrivateChat(userId)
{
	currentPrivateChat = userId;

	doEnable = (userId > -1);

	// Clear current chat
	$("#privChatAreaPn").jqxPanel("clearcontent");

	if (!doEnable)
	{
		$("#privateMsgIn").val("");
		$("#userList").jqxListBox("clearSelection");
		$("#privChatUserLb").html("");
	}
	else
	{
		$("#privChatUserLb").html("with <b>" + sfs.userManager.getUserById(userId).name + "</b>");

		// Fill chat with history
		if (privateChats[userId] != null)
		{
			privateChats[userId].toRead = 0;

			for (var i = 0; i < privateChats[userId].queue.length; i++)
				writeToPrivateChatArea(privateChats[userId].queue[i]);
		}
	}

	$("#privChatAreaPn").jqxPanel({disabled:!doEnable});

	enableTextField("#privateMsgIn", doEnable);
	enableButton("#sendPrivMsgBt", doEnable);
	enableButton("#deselectUserBt", doEnable);
}

function enableRoomControls(doEnable)
{
	enableButton("#leaveRoomBt", doEnable);
	enableTextField("#newRoomNameIn", doEnable);
	enableButton("#setRoomNameBt", doEnable);
	enableTextField("#newPasswordIn", doEnable);
	enableButton("#setRoomPwdBt", doEnable);
	$("#newRoomSizeIn").jqxNumberInput({disabled:!doEnable});
	enableButton("#setRoomSizeBt", doEnable);

	if (!doEnable)
	{
		$("#newRoomNameIn").val("");
		$("#newPasswordIn").val("");
		$("#newRoomSizeIn").jqxNumberInput({decimal:10});
	}
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
	var meIndex = -1;

	if (sfs.lastJoinedRoom != null)
	{
		var users = sfs.lastJoinedRoom.getUserList();

		for (var u in users)
		{
			var user = users[u];

			if (user.isItMe)
				meIndex = index;

			var item = {};
			item.html = "<div><p class='itemTitle'><strong>" + user.name + "</strong>" + (user.isItMe ? " (you)" : "") + "</p>";

			if (user.containsVariable("nick"))
				item.html += "<p class='itemSub'>Nickname: <strong>" + user.getVariable("nick").value + "</strong></p>";

			if (!user.isItMe && privateChats[user.id] != null && privateChats[user.id].toRead > 0)
				item.html += "<p class='itemSub toRead'>" + privateChats[user.id].toRead + " PM to read</p>";

			item.html += "</div>";

			item.title = user.name;
			item.userObj = user;

			source.push(item);

			if (currentPrivateChat > -1 && user.id == currentPrivateChat)
				selectedIndex = index;

			index++;
		}
	}

	// Populate list
	$("#userList").jqxListBox({source: source});

	// Disable item corresponding to myself
	if (meIndex > -1)
		$("#userList").jqxListBox("disableAt", meIndex);

	// Set selected index
	$("#userList").jqxListBox("selectedIndex", selectedIndex);

	// Make sure selected index is visible
	if (selectedIndex > -1)
		$("#userList").jqxListBox("ensureVisible", selectedIndex + 1);
}

function resetRoomListSelection()
{
	// Reset roomlist selection
	if (sfs.lastJoinedRoom != null)
	{
		var index = searchRoomList(sfs.lastJoinedRoom.id);
		$("#roomList").jqxListBox("selectIndex", index);
	}
	else
		$("#roomList").jqxListBox("clearSelection");
}

function searchRoomList(roomId)
{
	var items = $("#roomList").jqxListBox("source");

	if (items != null)
	{
		for (var i = 0; i < items.length; i++)
		{
			var room = items[i].roomObj;

			if (room.id == roomId)
				return i;
		}
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
	// Show topic if corresponding Room Variable is set
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

	// Hide topic if null Room is passed or no Room Variable is set or Variable is null
	$("#chatTopicLb").html("");
	$("#roomTopicIn").val("");
}
