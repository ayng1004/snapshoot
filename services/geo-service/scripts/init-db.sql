-- Création des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Table des localisations
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    location_type VARCHAR(50) NOT NULL DEFAULT 'user',
    reference_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    geom GEOGRAPHY(POINT) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_reference_id ON locations(reference_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_expires ON locations(expires_at);
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST(geom);

-- Fonction pour mettre à jour le timestamp 'expires_at' pour les localisations de type 'story'
CREATE OR REPLACE FUNCTION set_story_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location_type = 'story' AND NEW.expires_at IS NULL THEN
        NEW.expires_at = NOW() + INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour définir automatiquement la date d'expiration des stories
CREATE TRIGGER set_story_location_expiration
BEFORE INSERT ON locations
FOR EACH ROW
EXECUTE FUNCTION set_story_expiration();

-- Fonction pour supprimer les localisations expirées
CREATE OR REPLACE FUNCTION delete_expired_locations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM locations
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;