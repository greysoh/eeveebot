import axios from 'axios';

import { userAgent } from './index.mjs';

export async function getInstances(hideDownInstances = true) {
  const instanceList = {
    clearWeb: {},
    torHiddenService: {}
  };
  
  const { data } = await axios.get("https://searx.space/data/instances.json", {
    headers: {
      "User-Agent": userAgent
    }
  });

  const instanceListRaw = data.instances;

  for (const instanceKey of Object.keys(instanceListRaw)) {
    const finalDestination = instanceKey.endsWith(".onion/") ? instanceList.torHiddenService : instanceList.clearWeb;
    const instance = instanceListRaw[instanceKey];

    if (hideDownInstances && instance.error) continue;

    finalDestination[instanceKey] = instance;
  }

  return instanceList;
}