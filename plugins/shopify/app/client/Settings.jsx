import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, TextField, Button, Text, Banner, BlockStack, Box, Link } from '@shopify/polaris';

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial settings from server
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        if (data.api_key) setApiKey(data.api_key);
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      
      if (response.ok) {
        setIsSaved(true);
      }
    } catch (e) {
      console.error("Failed to save settings", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page title="PricePilot Configuration">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {isSaved && (
              <Banner tone="success" onDismiss={() => setIsSaved(false)}>
                Settings saved successfully. PricePilot is now active on your store.
              </Banner>
            )}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Connect Optimization Engine
                </Text>
                <Text as="p" tone="subdued">
                  Enter your PricePilot API Key to enable automatic price optimization on your storefront.
                </Text>
                <TextField
                  label="API Key"
                  value={apiKey}
                  onChange={(val) => setApiKey(val)}
                  autoComplete="off"
                  placeholder="pp_live_..."
                  helpText={
                    <Text as="span" tone="subdued">
                      Get your key from the <Link url="https://pricepilot.site/dashboard" external>PricePilot Dashboard</Link>.
                    </Text>
                  }
                />
                <Box>
                  <Button variant="primary" loading={isLoading} onClick={handleSave}>
                    Save Connection
                  </Button>
                </Box>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Installation Guide
              </Text>
              <BlockStack gap="200">
                <Text as="p">1. Save your API Key in the left panel.</Text>
                <Text as="p">2. Go to <b>Online Store &gt; Themes &gt; Customize</b>.</Text>
                <Text as="p">3. In <b>App Embeds</b>, enable "PricePilot Optimizer".</Text>
              </BlockStack>
              <Box paddingBlockStart="200">
                <Button url="https://pricepilot.site/docs" external>
                  View Documentation
                </Button>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
