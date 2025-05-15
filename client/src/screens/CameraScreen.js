import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const CameraScreen = () => {
  // Version simplifiée sans Camera pour le débogage
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Écran Caméra</Text>
      <Text style={styles.subtext}>Camera temporairement désactivée pour débogage</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
});

export default CameraScreen;