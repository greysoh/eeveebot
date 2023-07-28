import json
import sys
import os

from transformers import LlamaTokenizer, LlamaForCausalLM
from flask import Flask, request
import logging
import torch

# Effectively disable all logging.
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

llm_type = os.environ["LLM_TYPE"]
llm_path = os.environ["LLM_PATH"]

def log_message(stage, message):
  lulz_dict = {
    "type": stage,
    "message": message
  }

  #lulz_str = '{"type":"' + stage + '","message":"' + message + '"}'eng
  print(json.dumps(lulz_dict).rstrip())

app = Flask(__name__)

log_message("init", "Loading models...")
tokenizer = LlamaTokenizer.from_pretrained(llm_path, legacy=False)
model = LlamaForCausalLM.from_pretrained(
    llm_path, torch_dtype=torch.float16, device_map='auto'
).to("cuda:0")

log_message("init", "Ready")

@app.route('/send', methods=['POST'])
def run_llm():
  json = request.get_json()
  prompt = json["message"]

  input_ids = tokenizer(prompt, return_tensors="pt").to("cuda:0").input_ids
  generation_output = model.generate(
    input_ids=input_ids, max_new_tokens=1
  )

  decoded_output = tokenizer.decode(generation_output[0])
  
  return {
    "message": decoded_output
  }