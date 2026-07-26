import { create } from 'zustand';

interface MailState {
  mails: any[];
  readMails: string[];
  unreadCount: number;
  setMailsData: (mails: any[], readMails: string[]) => void;
  markAsReadLocally: (mailId: string) => void;
}

export const useMailStore = create<MailState>((set) => ({
  mails: [],
  readMails: [],
  unreadCount: 0,
  setMailsData: (mails, readMails) => {
    const unreadCount = mails.filter(m => !readMails.includes(m.id)).length;
    set({ mails, readMails, unreadCount });
  },
  markAsReadLocally: (mailId) => set((state) => {
    if (state.readMails.includes(mailId)) return state;
    const newReadMails = [...state.readMails, mailId];
    const unreadCount = state.mails.filter(m => !newReadMails.includes(m.id)).length;
    return { readMails: newReadMails, unreadCount };
  })
}));
