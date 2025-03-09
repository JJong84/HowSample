# How Sample?
Website for Sampling Analysis and Editing

Final Project for CTP431-KAIST

You can also read this at [Project Page](https://jjong84.github.io/CTP431-Final/)

## Index

1. [Introduction](#introduction)
2. [Breakdown Mode](#breakdown-mode)
   1. [Web Interface](#web-interface)
3. [Sampler Mode](#sampler-mode)
   1. [Web Interface](#web-interface-1)
4. [Reference](#reference)

## Introduction

Sampling has become one of the most important composition techniques in modern music production. Numerous masterpiece tracks have been born through sampling, and many producers learn and get inspirations from understanding how these tracks were created and identifying their original sources. The best way to train and improve sampling skills is experiencing these breakdowns.

One representative database created by listeners' collective efforts is [**“WhoSampled”**](https://www.whosampled.com/). It's a website that users can easily check which songs have sampled other tracks. However, it is hard to understand the specific sampling process because this site only provides basic song information. Additionally, users must breakdown the process by their own ears. And the descriptions are often inconsistent and unclear since it’s user-contributed.

Our web application, **“HowSample”** can be a great solution for these problems. It offers two modes, **breakdown mode** and **sampler mode**.

Our web application is built with React and Typescript, and the logic for the breakdown mode is built with Python.

## Breakdown Mode

Breakdown mode has a powerful feature that analyzes the detailed sampling process of a track. Moreover, samples analyzed in the breakdown mode can be directly loaded and used in sampler mode.

The Breakdown mode takes two inputs: the **target song** to be analyzed and the **original sampled song**. You can easily upload them by pressing **“SELECT TARGET AUDIO FILE”**, **“SELECT ORIGINAL AUDIO FILE”** buttons. Then, the uploaded song will be sent to the server and the breakdown result is sent back to the web. However, you cannot access to this feature yet. We found that our breakdown algorithm works well for the demo, but further research will be needed to improve the performance for more generalized inputs. We leaved this research as future work.

Our goal was to focus on tracks produced through **time-stretching** and **pitch-shifting** processes. “HowSample” can automatically analyze and return the time-stretch factor and pitch-shift factor that is used in the detailed sampling process, also indicating the exact sections where sampling occurred.

You can check the demo by pressing the **“LOAD DEMO”** button. For the demo, we analyzed the target song **‘Kanye West – Through the Wire (2003)’**, which sampled **‘Chaka Khan – Through the Fire (1985)’**.

For the every waveforms in the breakdown result, you can easily click them to play them. The waveform shown at the top is the waveform of the **target song**. And the **blue colored part** is the analyzed segment. The analyzed segment is also shown as the **red colored waveform** below. The **green waveform** shows the sampled part of the target song. Its detailed time information is written at right side. Also, there are **time-stretch / pitch-shift information** too. By applying these effects with the analyzed factors, we can earn the blue waveform. You can check that the reproduced sample segment matches well with the target song. Also, you can check the analyzed samples are automatically loaded to the library at the sampler mode too.

### Web Interface

![Breakdown Interface](https://github.com/user-attachments/assets/30aae9c1-f300-415e-82a5-8b951a0cfbb2)

## Sampler Mode

The **Sampler mode** functions similarly to traditional sampler instruments. In this mode, users can upload an audio file and transform it to create a new song, providing full creative control over the music editing and sampling process.

When a music file is uploaded, it is added to a list of tracks. By selecting a track from the table, a modal window opens, allowing users to perform various transformations on the audio. Within this modal, users can:

- Zoom in or out of the waveform for precise editing
- Chop segments of the audio
- Adjust the speed and pitch of the track in real time

These transformations can be previewed immediately, enabling users to verify whether the sample is suitable for their music.

Once the desired edits are completed, samples can be dragged and dropped onto a timeline at the top of the interface. To enhance visual organization, users have the option to increase the number of lines displayed in the timeline.

After editing, users can download the final composition as a `.wav` file by clicking the **Download** button.

For the demo, the application includes an example where the part of the **"Daft Punk - One More Time"** is recreated using the original track **"Eddie Johns - More Spell on You"**.

### Web Interface

![Sampler Interface](https://github.com/user-attachments/assets/c65dac28-b5fa-4d89-b69a-36cfbfd9634c)

![Sampler Modal Interface](https://github.com/user-attachments/assets/0b480ec3-7c05-48e8-ae49-82f571291706)

## Reference

Rouard, Simon, Francisco Massa, and Alexandre Défossez. **"Hybrid transformers for music source separation."**  
_ICASSP 2023-2023 IEEE International Conference on Acoustics, Speech and Signal Processing (ICASSP)._ IEEE, 2023.

Kim, Taejun, and Juhan Nam. **"All-in-one metrical and functional structure analysis with neighborhood attentions on demixed audio."**  
_2023 IEEE Workshop on Applications of Signal Processing to Audio and Acoustics (WASPAA)._ IEEE, 2023.

The following open-source repositories were also referenced:

- [olvb/phaze](https://github.com/olvb/phaze)
- [indutny/fft.js](https://github.com/indutny/fft.js/blob/master/lib/fft.js)
