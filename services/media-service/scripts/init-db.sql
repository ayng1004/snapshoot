-- Création des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des métadonnées des médias
CREATE TABLE IF NOT EXISTS media_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    original_filename VARCHAR(255),
    storage_path VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    media_size BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    thumbnail_path VARCHAR(255),
    reference_type VARCHAR(50), -- 'profile', 'message', 'story'
    reference_id UUID,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Table des tags associés aux médias
CREATE TABLE IF NOT EXISTS media_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID NOT NULL REFERENCES media_metadata(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_media_metadata_user_id ON media_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_media_metadata_media_type ON media_metadata(media_type);
CREATE INDEX IF NOT EXISTS idx_media_metadata_reference_type ON media_metadata(reference_type);
CREATE INDEX IF NOT EXISTS idx_media_metadata_reference_id ON media_metadata(reference_id);
CREATE INDEX IF NOT EXISTS idx_media_metadata_created_at ON media_metadata(created_at);
CREATE INDEX IF NOT EXISTS idx_media_tags_media_id ON media_tags(media_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_tag_name ON media_tags(tag_name);

-- Fonction pour mettre à jour le timestamp 'updated_at'
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le timestamp automatiquement
CREATE TRIGGER update_media_metadata_timestamp
BEFORE UPDATE ON media_metadata
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();