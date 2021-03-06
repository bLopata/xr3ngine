import React, { useState, useEffect } from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import './style.scss';
import {
    Avatar,
    Button,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    SwipeableDrawer,
    TextField
} from '@material-ui/core';
import {
    getChannels,
    getChannelMessages,
    createMessage,
    removeMessage,
    updateChatTarget,
    patchMessage,
    updateMessageScrollInit
} from '../../../../redux/chat/service';
import { selectAuthState} from '../../../../redux/auth/selector';
import { selectChatState } from '../../../../redux/chat/selector';
import {
    Clear,
    Delete,
    Edit,
    Save,
    Send
} from '@material-ui/icons';
import moment from 'moment';
import {User} from "@xr3ngine/common/interfaces/User";
import { Message } from '@xr3ngine/common/interfaces/Message';
import _ from 'lodash';

const mapStateToProps = (state: any): any => {
    return {
        authState: selectAuthState(state),
        chatState: selectChatState(state),
    };
};

const mapDispatchToProps = (dispatch: Dispatch): any => ({
    getChannels: bindActionCreators(getChannels, dispatch),
    getChannelMessages: bindActionCreators(getChannelMessages, dispatch),
    createMessage: bindActionCreators(createMessage, dispatch),
    removeMessage: bindActionCreators(removeMessage, dispatch),
    updateChatTarget: bindActionCreators(updateChatTarget, dispatch),
    patchMessage: bindActionCreators(patchMessage, dispatch),
    updateMessageScrollInit: bindActionCreators(updateMessageScrollInit, dispatch)
});

interface Props {
    authState?: any;
    bottomDrawerOpen: boolean;
    setBottomDrawerOpen: any;
    setLeftDrawerOpen: any;
    chatState?: any;
    getChannels?: any;
    getChannelMessages?: any;
    createMessage?: any;
    removeMessage?: any;
    updateChatTarget?: any;
    patchMessage?: any;
    updateMessageScrollInit?: any;
}

const BottomDrawer = (props: Props): any => {
    const {
        authState,
        chatState,
        getChannels,
        getChannelMessages,
        createMessage,
        removeMessage,
        bottomDrawerOpen,
        setBottomDrawerOpen,
        setLeftDrawerOpen,
        updateChatTarget,
        patchMessage,
        updateMessageScrollInit
    } = props;

    const messageRef = React.useRef();
    const messageEl = messageRef.current;
    const user = authState.get('user') as User;
    const channelState = chatState.get('channels');
    const channels = channelState.get('channels');
    const targetObject = chatState.get('targetObject');
    const targetObjectType = chatState.get('targetObjectType');
    const targetChannelId = chatState.get('targetChannelId');
    const messageScrollInit = chatState.get('messageScrollInit');
    const [messageScrollUpdate, setMessageScrollUpdate] = useState(false);
    const [topMessage, setTopMessage] = useState({});
    const [messageCrudSelected, setMessageCrudSelected] = useState('');
    const [messageDeletePending, setMessageDeletePending] = useState('');
    const [messageUpdatePending, setMessageUpdatePending] = useState('');
    const [editingMessage, setEditingMessage] = useState('');
    const [composingMessage, setComposingMessage] = useState('');
    const activeChannel = channels.get(targetChannelId);

    useEffect(() => {
        console.log(`useEffect messageScrollInit: ${messageScrollInit}`);
        if (messageScrollInit === true && messageEl != null && (messageEl as any).scrollTop != null) {
            console.log('Triggering messageScrollInit');
            (messageEl as any).scrollTop = (messageEl as any).scrollHeight;
            console.log(updateMessageScrollInit);
            updateMessageScrollInit(false);
            setMessageScrollUpdate(false);
        }
        if (messageScrollUpdate === true) {
            setMessageScrollUpdate(false);
            if (messageEl != null && (messageEl as any).scrollTop != null) {
                (messageEl as any).scrollTop = (topMessage as any).offsetTop;
            }
        }
    }, [chatState]);

    useEffect(() =>  {
        if (channelState.get('updateNeeded') === true) {
            getChannels();
        }
    }, [channelState]);

    useEffect(() => {
        channels.forEach((channel) => {
            if (chatState.get('updateMessageScroll') === true) {
                chatState.set('updateMessageScroll', false);
                if (channel.id === targetChannelId && messageEl != null && (((messageEl as any).scrollHeight - (messageEl as any).scrollTop - (messageEl as any).firstElementChild?.offsetHeight) <= (messageEl as any).clientHeight + 20)) {
                    (messageEl as any).scrollTop = (messageEl as any).scrollHeight;
                }
            }
            if (channel.updateNeeded === true) {
                getChannelMessages(channel.id);
            }
        });
    }, [channels]);


    const openLeftDrawer = (e: any): void => {
        setBottomDrawerOpen(false);
        setLeftDrawerOpen(true);
    };

    const handleComposingMessageChange = (event: any): void => {
        const message = event.target.value;
        setComposingMessage(message);
    };

    const handleEditingMessageChange = (event: any): void => {
        const message = event.target.value;
        setEditingMessage(message);
    };

    const packageMessage = (event: any): void => {
        if (composingMessage.length > 0) {
            createMessage({
                targetObjectId: targetObject.id,
                targetObjectType: targetObjectType,
                text: composingMessage
            });
            setComposingMessage('');
        }
    };

    const setActiveChat = (channel): void => {
        console.log('setActiveChat:');
        updateMessageScrollInit(true);
        const channelType = channel.channelType;
        const target = channelType === 'user' ? (channel.user1?.id === user.id ? channel.user2 : channel.user2?.id === user.id ? channel.user1 : {}) : channelType === 'group' ? channel.group : channel.party;
        updateChatTarget(channelType, target, channel.id);
        setMessageDeletePending('');
        setMessageUpdatePending('');
        setEditingMessage('');
        setComposingMessage('');
    };

    const onChannelScroll = (e): void => {
        if ((e.target.scrollHeight - e.target.scrollTop) === e.target.clientHeight ) {
            nextChannelPage();
        }
    };

    const onMessageScroll = (e): void => {
        console.log(messageScrollInit);
        if (e.target.scrollTop === 0 && (e.target.scrollHeight > e.target.clientHeight) && messageScrollInit !== true && (activeChannel.skip + activeChannel.limit) < activeChannel.total) {
            setMessageScrollUpdate(true);
            setTopMessage((messageEl as any).firstElementChild);
            nextMessagePage();
        }
    };

    const nextChannelPage = (): void => {
        if ((channelState.get('skip') + channelState.get('limit')) < channelState.get('total')) {
            getChannels(channelState.get('skip') + channelState.get('limit'));
        }
    };

    const nextMessagePage = (): void => {
        if ((activeChannel.skip + activeChannel.limit) < activeChannel.total) {
            getChannelMessages(targetChannelId, activeChannel.skip + activeChannel.limit);
        }
        else {
            setMessageScrollUpdate(false);
        }
    };

    const getMessageUser = (message: Message): User => {
        let user;
        const channel = channels.get(message.channelId);
        if (channel.channelType === 'user') {
            user = channel.userId1 === message.senderId ? channel.user1 : channel.user2;
        } else if (channel.channelType === 'group') {
            const groupUser = _.find(channel.group.groupUsers, (groupUser) => {
                return groupUser.userId === message.senderId;
            });
            user = groupUser != null ? groupUser.user : {};
        } else if (channel.channelType === 'party') {
            const partyUser = _.find(channel.party.partyUsers, (partyUser) => {
                return partyUser.userId === message.senderId;
            });
            user = partyUser != null ? partyUser.user : {};
        }

        return user;
    };

    const generateMessageSecondary = (message: Message): string => {
        const date = moment(message.createdAt).format('MMM D YYYY, h:mm a');
        if (message.senderId !== user.id) {
            return `${getMessageUser(message).name? getMessageUser(message).name : 'A former user'} on ${date}`;
        }
        else {
            return date;
        }
    };

    const loadMessageEdit = (e: any, message: Message) => {
        e.preventDefault();
        setMessageUpdatePending(message.id);
        setEditingMessage(message.text);
        setMessageDeletePending('');
    };

    const showMessageDeleteConfirm = (e: any, message: Message) => {
        e.preventDefault();
        setMessageDeletePending(message.id);
        setMessageUpdatePending('');
    };

    const cancelMessageDelete = (e: any) => {
        e.preventDefault();
        setMessageDeletePending('');
    };

    const confirmMessageDelete = (e: any, message: Message) => {
        e.preventDefault();
        setMessageDeletePending('');
        removeMessage(message.id, message.channelId);
    };

    const cancelMessageUpdate = (e: any) => {
        e.preventDefault();
        setMessageUpdatePending('');
        setEditingMessage('');
    };

    const confirmMessageUpdate = (e: any, message: Message) => {
        e.preventDefault();
        patchMessage(message.id, editingMessage);
        setMessageUpdatePending('');
        setEditingMessage('');
    };

    const toggleMessageCrudSelect = (e: any, message: Message) => {
        e.preventDefault();
        if (message.senderId === user.id) {
            if (messageCrudSelected === message.id && messageUpdatePending !== message.id) {
                setMessageCrudSelected('');
            } else {
                setMessageCrudSelected(message.id);
            }
        }
    };

    return (
        <div>
            <SwipeableDrawer
                className="flex-column"
                anchor="bottom"
                open={props.bottomDrawerOpen === true}
                onClose={() => {setBottomDrawerOpen(false);}}
                onOpen={() => {}}
            >
                <div className="bottom-container">
                    <List onScroll={(e) => onChannelScroll(e)} className="chat-container">
                        { channels && channels.size > 0 && Array.from(channels).sort(([channelId1, channel1], [channelId2, channel2]) => new Date(channel2.updatedAt).getTime() - new Date(channel1.updatedAt).getTime()).map(([channelId, channel], index) => {
                            return <ListItem
                                key={channelId}
                                className="selectable"
                                onClick={() => setActiveChat(channel)}
                                selected={ channelId === targetChannelId }
                                divider={ index < channels.size - 1 }
                            >
                                    { channel.channelType === 'user' &&
                                        <ListItemAvatar>
                                            <Avatar src={channel.userId1 === user.id ? channel.user2.avatarUrl: channel.user1.avatarUrl}/>
                                        </ListItemAvatar>
                                    }
                                    <ListItemText primary={channel.channelType === 'user' ? (channel.user1?.id === user.id ? channel.user2.name : channel.user2?.id === user.id ? channel.user1.name : '') : channel.channelType === 'group' ? channel.group.name : 'Current party'}/>
                                </ListItem>;
                        })
                        }
                        { channels == null || channels.size === 0 &&
                            <ListItem key="no-chats" disabled>
                                <ListItemText primary="No active chats"/>
                            </ListItem>
                        }
                    </List>
                    <div className="list-container">
                        <List ref={(messageRef as any)} onScroll={(e) => onMessageScroll(e)} className="message-container">
                            { activeChannel != null && activeChannel.messages && activeChannel.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((message) => {
                                return <ListItem
                                    className={message.senderId === user.id ? "message self" : "message other"}
                                    key={message.id}
                                    onMouseEnter={(e) => toggleMessageCrudSelect(e, message)}
                                    onMouseLeave={(e) => toggleMessageCrudSelect(e, message)}
                                    onTouchEnd={(e) => toggleMessageCrudSelect(e, message)}
                                >
                                    { message.senderId !== user.id &&
                                        <ListItemAvatar>
                                            <Avatar src={getMessageUser(message).avatarUrl}/>
                                        </ListItemAvatar>
                                    }
                                    {messageUpdatePending !== message.id &&
                                        <ListItemText
                                            primary={message.text}
                                            secondary={generateMessageSecondary(message)}
                                        />
                                    }
                                    {message.senderId === user.id && messageUpdatePending !== message.id &&
                                        <div>
                                            { messageDeletePending !== message.id && messageCrudSelected === message.id &&
                                            <div className="crud-controls">
                                                    {messageDeletePending !== message.id &&
                                                    <Edit className="edit"
                                                          onClick={(e) => loadMessageEdit(e, message)}
                                                          onTouchEnd={(e) => loadMessageEdit(e, message)}
                                                    />
                                                    }
                                                    {messageDeletePending !== message.id &&
                                                    <Delete className="delete"
                                                            onClick={(e) => showMessageDeleteConfirm(e, message)}
                                                            onTouchEnd={(e) => showMessageDeleteConfirm(e, message)}
                                                    />
                                                    }
                                                </div>
                                            }
                                            {messageDeletePending === message.id &&
                                                <div className="crud-controls">
                                                    {messageDeletePending === message.id &&
                                                    <Delete className="delete"
                                                            onClick={(e) => confirmMessageDelete(e, message)}
                                                            onTouchEnd={(e) => confirmMessageDelete(e, message)}
                                                    />
                                                    }
                                                    {messageDeletePending === message.id &&
                                                    <Clear className="cancel"
                                                           onClick={(e) => cancelMessageDelete(e)}
                                                           onTouchEnd={(e) => cancelMessageDelete(e)}
                                                    />
                                                    }
                                                </div>
                                            }
                                        </div>
                                    }
                                    {messageUpdatePending === message.id &&
                                        <div className="message-edit">
                                            <TextField
                                                variant="outlined"
                                                margin="normal"
                                                multiline
                                                fullWidth
                                                id="editingMessage"
                                                label="Message text"
                                                name="editingMessage"
                                                autoFocus
                                                value={editingMessage}
                                                inputProps={{
                                                    maxLength: 1000
                                                }}
                                                onChange={handleEditingMessageChange}
                                            />
                                            <div className="editing-controls">
	                                            <Clear className="cancel" onClick={(e) => cancelMessageUpdate(e)} onTouchEnd={(e) => cancelMessageUpdate(e)}/>
                                                <Save className="save" onClick={(e) => confirmMessageUpdate(e, message)} onTouchEnd={(e) => confirmMessageUpdate(e, message)}/>
                                            </div>
                                        </div>
                                    }
                                </ListItem>;
                            })
                            }
                            { targetChannelId.length === 0 && targetObject.id != null &&
                                <div className="first-message-placeholder">
                                    <div>{targetChannelId}</div>
                                    Start a chat with {(targetObjectType === 'user' || targetObjectType === 'group') ? targetObject.name : 'your current party'}
                                </div>
                            }
                        </List>
                        {targetObject != null && targetObject.id != null &&
                            <div className="flex-center">
                                <div className="chat-box">
                                    <TextField
                                        variant="outlined"
                                        margin="normal"
                                        multiline
                                        fullWidth
                                        id="newMessage"
                                        label="Message text"
                                        name="newMessage"
                                        autoFocus
                                        value={composingMessage}
                                        inputProps={{
                                            maxLength: 1000
                                        }}
                                        onChange={handleComposingMessageChange}
                                    />
                                    <Button variant="contained"
                                            color="primary"
                                            startIcon={<Send/>}
                                            onClick={packageMessage}
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        }
                        { (targetObject == null || targetObject.id == null) &&
                            <div className="no-chat">
                                <div>
                                    Start a chat with a friend or group from the left drawer
                                </div>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={openLeftDrawer}
                                >
                                    Open Drawer
                                </Button>
                            </div>
                        }
                    </div>
                </div>
            </SwipeableDrawer>
        </div>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(BottomDrawer);
