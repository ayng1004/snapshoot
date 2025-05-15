-- Création des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Table des stories
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    media_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    media_type VARCHAR(50) NOT NULL,
    caption TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geom GEOGRAPHY(POINT) GENERATED ALWAYS AS (
        CASE 
            WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography 
            ELSE NULL 
        END
    ) STORED
);

-- Table des vues de stories
CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_geom ON stories USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_user_id ON story_views(user_id);

-- Fonction pour supprimer les stories expirées
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM stories
    WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour compter les vues d'une story
CREATE OR REPLACE FUNCTION count_story_views(story_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count FROM story_views WHERE story_id = story_uuid;
    RETURN view_count;
END;
$$ LANGUAGE plpgsql;