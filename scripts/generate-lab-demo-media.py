"""Generate original abstract QA clips, not validated emotion stimuli."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math, subprocess
out=Path(__file__).resolve().parents[1]/'examples/lab-meeting-2026-09-25/media'
out.mkdir(parents=True,exist_ok=True)
font='/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc'
titlefont=ImageFont.truetype(font,30);small=ImageFont.truetype(font,16)
for index,(name,label,kind) in enumerate([('QA_SLOW_01','ゆるやかな波 / A','slow'),('QA_SLOW_02','ゆるやかな波 / B','slow'),('QA_PULSE_01','動くリズム / A','pulse'),('QA_PULSE_02','動くリズム / B','pulse')]):
 proc=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','20','-i','-','-an','-c:v','libx264','-pix_fmt','yuv420p','-crf','23','-movflags','+faststart',str(out/(name+'.mp4'))],stdin=subprocess.PIPE)
 for frame in range(120):
  t=frame/20;im=Image.new('RGB',(640,360),(13,25,38));d=ImageDraw.Draw(im)
  if kind=='slow':
   for band in range(7):
    points=[(x,175+band*15+25*math.sin(x/95+t*.65+index+band*.4)) for x in range(0,641,4)]
    d.line(points,fill=(35+band*9,119+band*10,149+band*8),width=3)
  else:
   for row in range(4):
    for col in range(9):
     r=5+9*(.5+.5*math.sin(t*2+col*.6+row*.9+index))
     x=78+col*60;y=144+row*38
     d.ellipse((x-r,y-r,x+r,y+r),fill=(240,151+row*15,83+row*13))
  d.text((28,22),'PHYSIOFLOW  /  DEMO STIMULUS',font=small,fill=(139,172,191))
  d.text((28,55),label,font=titlefont,fill=(239,245,247))
  d.rectangle((28,310,612,312),fill=(47,65,81));d.rectangle((28,310,28+584*frame/119,312),fill=(180,214,189))
  d.text((28,326),'テスト素材・研究用刺激ではありません',font=small,fill=(170,191,204))
  proc.stdin.write(im.tobytes())
 proc.stdin.close();assert proc.wait()==0
 print(name)
