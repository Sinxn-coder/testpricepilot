import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, TextField, Button, TextContainer, Banner, AlphaStack } from '@shopify/polaris';

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate saving to backend
    setTimeout(() => {
      setIsLoading(false);
      setIsSaved(true);
    }, 1000);
  };

  return (
    <Page title="PricePilot Configuration">
      <Layout>
        <Layout.Section>
          {isSaved && (
            <Banner status="success" onDismiss={() => setIsSaved(false)}>
              Settings saved successfully. PricePilot is now active on your store.
            </Banner>
          )}
          <Card sectioned>
            <AlphaStack gap="4">
              <TextContainer>
                <p>Enter your PricePilot API Key to enable automatic price optimization on your storefront.</p>
              </TextContainer>
              <TextField
                label="API Key"
                value={apiKey}
                onChange={(val) => setApiKey(val)}
                autoComplete="off"
                placeholder="pp_live_..."
                helpText={
                  <span>
                    Get your key from the <a href="https://pricepilot.site/dashboard" target="_blank">PricePilot Dashboard</a>.
                  </span>
                }
              />
              <Button primary loading={isLoading} onClick={handleSave}>
                Save Connection
              </Button>
            </AlphaStack>
          </Card>
        </Layout.Section>
        
        <Layout.Section secondary>
          <Card title="Installation Guide" sectioned>
            <TextContainer>
              <p>1. Save your API Key.</p>
              <p>2. Go to <b>Online Store > Themes > Customize</b>.</p>
              <p>3. In <b>App Embeds</b>, enable "PricePilot Optimizer".</p>
            </TextContainer>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
