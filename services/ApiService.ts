
import { WeeklyData, User, MENTORING_GROUPS } from '../types';
import { INITIAL_DATA } from '../constants';

class ApiService {
  
  // --- HELPER: LOCAL STORAGE ---
  private getLocalUser(): User | null {
    const s = localStorage.getItem('nur_quest_session');
    return s ? JSON.parse(s) : null;
  }

  private getLocalUsers(): User[] {
    const s = localStorage.getItem('nur_quest_users');
    return s ? JSON.parse(s) : [];
  }

  // --- REGISTER: STRICTLY OFFLINE ---
  async registerUserSafe(newUser: User): Promise<{ success: boolean; isOffline: boolean; error?: string }> {
    try {
      // FORCE OFFLINE: Langsung simpan ke Local Storage
      const localUsers = this.getLocalUsers();
      
      if (localUsers.some(u => u.username === newUser.username)) {
         return { success: false, isOffline: true, error: "Username sudah ada (di HP ini)." };
      }
      
      const updatedUsers = [...localUsers, newUser];
      localStorage.setItem('nur_quest_users', JSON.stringify(updatedUsers));
      
      // Init tracker kosong untuk user baru ini di local
      const newTracker = { ...INITIAL_DATA, lastUpdated: new Date().toISOString() };
      localStorage.setItem(`ibadah_tracker_${newUser.username}`, JSON.stringify(newTracker));

      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));

      return { success: true, isOffline: true };
    } catch (e: any) {
      return { success: false, isOffline: true, error: e.message };
    }
  }

  // --- SYNC: STRICTLY OFFLINE ---
  async sync(currentUser: User | null, localData: WeeklyData, localGroups: string[]): Promise<any> {
    const localUsers = this.getLocalUsers();
    
    // Result object (Offline/Local)
    const result = {
        success: true, 
        users: localUsers,
        trackers: {} as Record<string, WeeklyData>,
        groups: MENTORING_GROUPS, 
        assets: {}, 
        archives: [],
        attendance: {}
    };

    // Populate trackers from LocalStorage
    localUsers.forEach(u => {
        const t = localStorage.getItem(`ibadah_tracker_${u.username}`);
        if (t) result.trackers[u.username] = JSON.parse(t);
    });

    if (currentUser) {
       // Save current user's latest data to local storage "cloud" simulation
       localStorage.setItem(`ibadah_tracker_${currentUser.username}`, JSON.stringify(localData));
       result.trackers[currentUser.username] = localData;
    }
    
    // Simulate quick network check
    // await new Promise(resolve => setTimeout(resolve, 300));

    return result;
  }

  // --- STORAGE & UTILS ---
  async uploadAvatar(file: File, username: string): Promise<string | null> {
    // Offline: Return fake local URL using Blob
    console.log("Offline Upload: Generating Blob URL");
    return URL.createObjectURL(file);
  }

  async updateUserStatus(username: string, status: string): Promise<boolean> {
     const users = this.getLocalUsers();
     const idx = users.findIndex(u => u.username === username);
     if (idx >= 0) {
        users[idx].status = status as any;
        localStorage.setItem('nur_quest_users', JSON.stringify(users));
        return true;
     }
     return false;
  }

  async deleteUser(username: string): Promise<boolean> {
    const users = this.getLocalUsers().filter(u => u.username !== username);
    localStorage.setItem('nur_quest_users', JSON.stringify(users));
    return true;
  }
  
  async saveAttendance(date: string, records: any): Promise<boolean> { return true; }
  async fetchDatabase() { return { users: [], trackers: {}, groups: [], assets: {}, archives: [], attendance: {} }; }
  async updateDatabase(db: any) { return true; }
  async uploadGlobalAsset(id: string, data: string) { return true; } 
  async deleteGlobalAsset(id: string) { return true; }
}

export const api = new ApiService();