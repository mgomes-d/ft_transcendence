import { Channel } from "@/types/chat.interface";
import { useState } from "react";
import { RiGitRepositoryPrivateFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { JoinChannelDialog } from "./JoinChannelDialog";

interface ChannelElementProps {
  channel: Channel;
  setSheetOpen: (value: boolean) => void;
}

const ChannelElement = ({ channel, setSheetOpen }: ChannelElementProps) => {
  const [dialog, setDialog] = useState<boolean>(false);
  const navigate = useNavigate();

  const joinChannel = () => {
    if ((!channel.isConnected && channel.protected) || !channel.isMember) {
      setDialog(true);
    } else {
      navigate("/chat/" + channel.id);
      setSheetOpen(false);
    }
  };

  return (
    <>
      <button className="p-3 w-full flex flex-col rounded-md hover:bg-card" onClick={joinChannel}>
        <h1 className="text-sm font-normal">{channel.name}</h1>
        <div className="flex items-center gap-1">
          {channel.public ? (
            <h2 className="text-xs font-normal text-muted-foreground">Public</h2>
          ) : (
            <h2 className="text-xs font-normal text-muted-foreground">Private</h2>
          )}
          {channel.protected && <RiGitRepositoryPrivateFill className="w-[0.75rem] h-[0.75rem] text-muted-foreground" />}
        </div>
      </button>
      <JoinChannelDialog dialog={dialog} setDialog={setDialog} setSheetOpen={setSheetOpen} channel={channel} />
    </>
  );
};

export { ChannelElement };
