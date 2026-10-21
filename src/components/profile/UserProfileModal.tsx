import React from "react";
import {
  ProfileSettingsModal,
  type ProfileSettingsModalProps,
} from "./ProfileSettingsModal";

export type UserProfileModalProps = ProfileSettingsModalProps;

/**
 * Unified User Profile Modal
 * Displays aggregated cognitive metrics across all Synapse games:
 * - Total Games Played (ScaleGuess + Not Color Blind)
 * - Not Color Blind High Score
 * - Average Recall Accuracy
 * - ScaleGuess Personal Best
 * - Recent match breakdowns and avatar/profile management
 */
export const UserProfileModal: React.FC<UserProfileModalProps> = (props) => {
  return <ProfileSettingsModal {...props} />;
};

export default UserProfileModal;
