# 🚀 Nuggt: Go from 0 to 1 on any topic instantly

Join Discord: [Discord](https://discord.gg/JGF6f448)

🎥 **Demo**  

Uploading Screen Recording 2025-01-26 at 3.48.22 AM.mp4…

---

## 🌟 Features

- **🔍 Search & Research**  
  Gather info on any topic from the internet with the search feature.  
  Example: Search "How to make a good elevator pitch" and explore a detailed research tree.

- **📚 Context Creation**  
  Save important info to reusable contexts by highlighting and adding to the console. Use these to enrich chatbot conversations.

- **🤖 Chatbot with Contexts**  
  Select a context to include in your conversations with the AI. Makes responses smarter and more relevant!

- **✨ Beautify Graphs**  
  Auto-arrange your research nodes with a single click for easy navigation.

- **📊 Spreadsheet (Coming Soon)**  
  Manage your data better with this upcoming feature!

---

## 🛠️ Setup

1. **Clone the Repo**  
   ```bash
   git clone https://github.com/shoibloya/nuggt-research.git
   cd nuggt-research
   ```

2. **Create a `.env` File**  
   In the project root, create a `.env` file and add the following keys:
   ```env
   OPENAI_API_KEY="your-openai-api-key"
   TAVILY_API_KEY="your-tavily-api-key"
   FIRECRAWL_API_KEY="your-firecrawl-api-key"
   ```

   **Optional (for login & Firebase storage):**  
   Add these keys only if you want to log in and save data to Firebase:  
   ```env
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-firebase-auth-domain"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-firebase-storage-bucket"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-firebase-messaging-sender-id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your-firebase-app-id"
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-firebase-measurement-id"
   ```

3. **Install Dependencies**  
   ```bash
   npm install
   ```

4. **Run the App**  
   ```bash
   npm run dev
   ```  
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

Happy exploring! 🌟
