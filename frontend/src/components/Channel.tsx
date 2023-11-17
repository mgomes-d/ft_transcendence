import { useState } from "react";
import { Socket } from "socket.io-client";

interface ChannelComponentProps {
  channel: ChannelData;
  socket: Socket;
}

const ChannelComponent: React.FC<ChannelComponentProps> = ({ channel, socket }) => {
  console.log("ChannelComponent is being rendered:", channel.channelId);
  const [messageInput, setMessageInput] = useState('');

  const onSendMessage = () => {
    if (channel.channelId) {
      socket.emit('sendMessage', { channelId: channel.channelId, message: messageInput });
      console.log("Message sent!");
      setMessageInput('');
    }
  };

  return (
    <div className="channel-container">
      <div className="channel-header">
        {channel.channelName}
      </div>
      <div className="message-list">
        {channel.messages.map((message, index) => (
          <div key={index} className="message">
            {message.userId}: {message.content}
          </div>
        ))}
      </div>
      <div className="message-input">
        <input type="text" placeholder="Type your message" value={messageInput} onChange={(e) => setMessageInput(e.target.value)}/>
        <button onClick={onSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChannelComponent;