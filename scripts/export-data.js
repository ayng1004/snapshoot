const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_URL = 'VOTRE_URL_SUPABASE';
const SUPABASE_KEY = 'VOTRE_CLE_API_SUPABASE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Dossier d'export
const EXPORT_DIR = path.join(__dirname, 'export');
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR);
}

async function exportData() {
  try {
    console.log('Début de l\'export des données Supabase...');
    
    // Export des utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('Erreur lors de l\'export des utilisateurs:', usersError);
    } else {
      fs.writeFileSync(
        path.join(EXPORT_DIR, 'users.json'), 
        JSON.stringify(users, null, 2)
      );
      console.log(`✅ ${users.length} utilisateurs exportés`);
    }
    
    // Export des profils
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Erreur lors de l\'export des profils:', profilesError);
    } else {
      fs.writeFileSync(
        path.join(EXPORT_DIR, 'profiles.json'), 
        JSON.stringify(profiles, null, 2)
      );
      console.log(`✅ ${profiles.length} profils exportés`);
    }
    
    // Export des amitiés
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('*');
    
    if (friendshipsError) {
      console.error('Erreur lors de l\'export des amitiés:', friendshipsError);
    } else {
      fs.writeFileSync(
        path.join(EXPORT_DIR, 'friendships.json'), 
        JSON.stringify(friendships, null, 2)
      );
      console.log(`✅ ${friendships.length} amitiés exportées`);
    }
    
    // Export des conversations
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*');
    
    if (conversationsError) {
      console.error('Erreur lors de l\'export des conversations:', conversationsError);
    } else {
      fs.writeFileSync(
        path.join(EXPORT_DIR, 'conversations.json'), 
        JSON.stringify(conversations, null, 2)
      );
      console.log(`✅ ${conversations.length} conversations exportées`);
    }
    
    // Export des participants aux conversations
    const { data: conversationParticipants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('*');
    
    if (participantsError) {
      console.error('Erreur lors de l\'export des participants aux conversations:', participantsError);
    } else {
      fs.writeFileSync(
        path.join(EXPORT_DIR, 'conversation_participants.json'), 
        JSON.stringify(conversationParticipants, null, 2)
      );
      console.log(`✅ ${conversationParticipants.length} participants aux conversations exportés`);
    }
    
    // Export des messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*');
    
    if (messagesError) {
      console.error('Erreur lors de l\'export des messages:', messagesError);
    } else {
      fs.writeFileSync(
        path.join(EXPORT_DIR, 'messages.json'), 
        JSON.stringify(messages, null, 2)
      );
      console.log(`✅ ${messages.length} messages exportés`);
    }
    
    // Export des stories
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select('*');
    
    if (storiesError) {
      console.error('Erreur lors de l\'export des stories:', storiesError);
    } else {
      fs.writeFileSync(
        path.join(EXPORT_DIR, 'stories.json'), 
        JSON.stringify(stories, null, 2)
      );
      console.log(`✅ ${stories.length} stories exportées`);
    }
    
    // Export des localisations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*');
    
    if (locationsError) {
      console.error('Erreur lors de l\'export des localisations:', locationsError);
    } else {
      fs.writeFileSync(
        path.join(EXPORT_DIR, 'locations.json'), 
        JSON.stringify(locations, null, 2)
      );
      console.log(`✅ ${locations.length} localisations exportées`);
    }
    
    console.log('Export des données terminé avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'export des données:', error);
  }
}

exportData();