"""Idempotent, explicitly authored text-only extensions; never rewrites existing records."""
import json
from pathlib import Path
packs={
'g8u11':[
('exchange','değişim','Changing a bought item for another one.'),('refund','para iadesi','Money returned after you take an item back.'),('discount','indirim','A reduction in the usual price.'),('customer','müşteri','A person who buys goods or services.'),('shop assistant','mağaza görevlisi','A person who helps customers choose items in a shop.'),('cashier','kasiyer','A person who takes your payment at a till.'),('fitting room','deneme kabini','A small room where you try on clothes before buying them.'),('warranty','garanti','A promise to repair or replace a product within an agreed time.'),('faulty','kusurlu','Not working correctly because something is wrong.'),('delivery','teslimat','Taking an order to the address of its customer.'),('payment','ödeme','Giving money for goods or services.'),('cash','nakit','Money in the form of coins and banknotes.'),('size','beden','The clothing measurement that helps an item fit you.'),('purchase','satın alma','The act of buying something.'),('queue','sıra','A line of people waiting for their turn.')],
'g8u12':[
('shelter','barınak','A place that gives homeless animals care and protection.'),('adopt','sahiplenmek','To take an animal into your family and care for it.'),('owner','hayvan sahibi','A person responsible for a pet.'),('groom','tüy bakımını yapmak','To clean and brush an animal’s coat.'),('feed','beslemek','To give food to a person or animal.'),('clean','temizlemek','To remove dirt from something.'),('enclosure','çevrili yaşam alanı','An area surrounded by a fence or wall where an animal can stay.'),('litter tray','kedi tuvaleti','A container filled with material for a cat to use as a toilet.'),('exercise','egzersiz','Physical activity such as walking, running or playing.'),('responsibility','sorumluluk','A duty to look after something or do a task properly.'),('gentle','nazik','Kind and careful, without using much force.'),('stray','sahipsiz','Describing an animal that has no home or owner.'),('vet','veteriner','A person trained to examine and treat animals.'),('fresh water','temiz içme suyu','Clean drinking water that has been recently supplied.'),('supplies','malzemeler','Things needed for a particular activity or job.')]
}
questions={
'g8u11':[
('The headphones stopped working after purchase. Which items should you take back to the shop?','The headphones and the receipt.',['Only an empty shopping bag.','A timetable and a menu.']),
('Which service changes a jacket you bought for the same jacket in a larger size?','An exchange.',['A home delivery.','A discount on food.']),
('A coat usually costs 800 lira. It is on sale for 600 lira. How much do you save?','I save 200 lira.',['I save 600 lira.','I save 1,400 lira.']),
('You have chosen a T-shirt but want to check its size before buying it. Where should you try it on?','In the fitting room.',['At the bus stop.','Inside a delivery box.'])],
'g8u12':[
('A shelter asks for supplies for hungry cats. Which donation directly meets this request?','Cat food.',['Wall paint.','A school timetable.']),
('Before agreeing to care for a neighbour’s rabbit, what should you ask?','What food and daily care does it need?',['Where did you buy your shoes?','What time does the cinema close?']),
('A family cannot provide the daily care a pet needs. Which choice is responsible?','Wait until they can provide the necessary care.',['Adopt it and leave it without care.','Keep it only when it is convenient.']),
('Which action grooms a cat’s coat?','Brushing it gently.',['Reading a receipt.','Watering a plant.'])]
}
p=Path('dist/data/expedition-language.json');data=json.loads(p.read_text())
for unit in data['units']:
 uid=unit['id']
 if uid not in packs:continue
 words=[x[0] for x in packs[uid]]
 for i,(en,tr,definition) in enumerate(packs[uid]):
  key=f'{uid}-maxima-review-v1-{i+1}'
  if not any(x['id']==key for x in unit['vocabulary']):unit['vocabulary'].append({'id':key,'en':en,'tr':tr,'definition':definition,'source':'Maxima authored review extension v1'})
  if not any(x['id']==key+'-clue' for x in unit['descriptions']):unit['descriptions'].append({'id':key+'-clue','clue':definition,'answer':en,'options':[en,words[(i+5)%len(words)],words[(i+9)%len(words)]]})
 for i,(prompt,answer,options) in enumerate(questions[uid]):
  key=f'{uid}-maxima-context-v1-{i+1}'
  if not any(x['id']==key for x in unit['questions']):unit['questions'].append({'id':key,'prompt':prompt,'answer':answer,'options':[answer,*options],'source':'Maxima authored review extension v1'})
p.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
