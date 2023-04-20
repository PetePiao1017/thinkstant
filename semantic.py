from flask import Flask, request
from flask_cors import CORS
import openai
import os
import pinecone
import re
import tensorflow_hub as hub
import numpy as np
from sklearn.neighbors import NearestNeighbors

app = Flask(__name__)
CORS(app)

openAI_key= "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"



def text_to_chunks(texts, word_length=150):
    texts = texts.replace('\n', ' ')
    texts = re.sub('\s+', ' ', texts)
    texts=texts.split('. ')
   # texts=texts.split('\n')
    return texts



class SemanticSearch:
    
    def __init__(self):
        self.use = hub.load('https://tfhub.dev/google/universal-sentence-encoder/4')
        self.fitted = False
    
    
    def fit(self, data, batch=1000, n_neighbors=10):
        self.data = data
        self.embeddings = self.get_text_embedding(data, batch=batch)
        n_neighbors = min(n_neighbors, len(self.embeddings))
        self.nn = NearestNeighbors(n_neighbors=n_neighbors)
        self.nn.fit(self.embeddings)
        self.fitted = True

    
    def __call__(self, text, return_data=True):
        inp_emb = self.use([text])
        neighbors = self.nn.kneighbors(inp_emb, return_distance=False)[0]
        
        if return_data:
            return [self.data[i] for i in neighbors]
        else:
            return neighbors
    
    
    def get_text_embedding(self, texts, batch=1000):
        embeddings = []
        for i in range(0, len(texts), batch):
            text_batch = texts[i:(i+batch)]
            emb_batch = self.use(text_batch)
            embeddings.append(emb_batch)
        embeddings = np.vstack(embeddings)
        return embeddings


def load_recommender(text):
    global recommender   
  #  if os.path.isfile(embeddings_file):
  #      embeddings = np.load(embeddings_file)
  #      recommender.embeddings = embeddings
  #      recommender.fitted = True
  #      return "Embeddings loaded from file"
    
    chunks = text_to_chunks(text)
    recommender.fit(chunks)
  #  np.save(embeddings_file, recommender.embeddings)
    return 'Corpus Loaded.'


def generate_text(openAI_key,prompt, engine="text-davinci-003"):
    openai.api_key = openAI_key
    completions = openai.Completion.create(
        engine=engine,
        prompt=prompt,
        max_tokens=512,
        n=1,
        stop=None,
        temperature=0.7,
    )
    message = completions.choices[0].text
    return message
    
def generate_text2(openAI_key, prompt, engine="gpt-3.5-turbo"):
    openai.api_key = openAI_key
    messages = [{'role': 'system', 'content': 'You are a helpful assistant.'},
                {'role': 'user', 'content': prompt}]
    
    completions = openai.ChatCompletion.create(
        model=engine,
        messages=messages,
        max_tokens=512,
        n=1,
        stop=None,
        temperature=0.7,
    )
    message = completions.choices[0].message['content']
    return message

def generate_answer(question,openAI_key):
    topn_chunks = recommender(question)
    prompt = ""
    prompt += 'search results:\n\n'
    for c in topn_chunks:
        prompt += c + '\n\n'
        
    prompt += "Instructions: Compose a comprehensive reply to the query using the search results given. "\
              "with the same name, create separate answers for each. Only include information found in the results and "\
              "don't add any additional information. Make sure the answer is correct and don't output false content. "\
              "If the text does not relate to the query, simply state 'sorry, It is not mentioned but I think '. and then answer the question generally."\
              "search results which has nothing to do with the question. Only answer what is asked. The "\
              "answer should be short and concise. Answer step-by-step. \n\nQuery: {question}\nAnswer: "
    
    prompt += f"Query: {question}\nAnswer:"
    answer = generate_text2(openAI_key, prompt)
    return answer


recommender = SemanticSearch()


@app.route('/api/ai/embedding',methods = ['POST'])
def root():
   re_text=request.form['text']
   load_recommender(re_text)
   return 'ok'
@app.route('/api/ai/context',methods = ['POST'])
def context():   
   question = request.form['query']
   result = generate_answer(question,openAI_key)     
   return result
  
if __name__ == '__main__':
   app.run(port=3081, debug=True) 