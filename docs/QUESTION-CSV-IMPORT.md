# Question CSV intake

The question workspace's **Import questions** panel accepts UTF-8 CSV files containing up to 100 questions and no more than 1 MiB. This is structured question intake; it does not extract questions from PDF, Word documents or photographs.

1. Download the empty CSV template from the import panel.
2. Fill it in Excel, Google Sheets or another CSV editor, keeping the header names. Export as **CSV UTF-8**, with commas as separators.
3. Select the approved subject, syllabus topic and optional subtopic for the whole file. Split different topics into separate files.
4. Choose the CSV file and select **Preview CSV**. Fix every reported error in the source file and upload it again. Nothing is saved during preview.
5. Review the text, options, answer, explanation and source evidence. Confirm that source evidence has been supplied, then save the private drafts.
6. Close the import to refresh the question list. Submit saved drafts for independent review. Importing never approves or publishes questions.

| Column | Required value |
| --- | --- |
| question | Question text; up to 20,000 characters |
| option_a, option_b, option_c, option_d | Four different, nonempty choices; up to 4,000 characters each |
| correct_option | A, B, C or D |
| explanation | Explanation of the correct answer; up to 20,000 characters |
| difficulty | easy, medium or hard |
| attribution | ACE practice or JAMB |
| exam_year | Blank for an original ACE exercise; verified four-digit year for a JAMB past question |
| source_kind | original, licensed or permitted |
| source_title | Identifiable source or original exercise collection |
| author | Author or rights holder |
| source_url | HTTPS URL; required for licensed/permitted sources |
| rights_evidence | Evidence supporting original authorship or the stated licence/permission |

Keep question text and mathematical notation as plain text/Unicode. Embedded commas, quotation marks and newlines are supported when the CSV editor quotes cells correctly. Do not add publication flags, role fields, media URLs or database IDs. An original ACE exercise must use `ACE practice` and a blank exam year; it must not be presented as a historical JAMB question.

Each save is a separate audited database transaction. If one row cannot be confirmed, the importer stops. Earlier confirmed rows remain private; later rows are not attempted. Keep the displayed IDs/receipt and check the question list before preparing another upload. An unconfirmed row may already have saved, so do not replay the whole file blindly. Signing out or navigating away prevents further rows from starting, but a save already sent to the server may complete.

Source evidence supports review; entering a licence claim does not itself establish permission. A different administrator must review the question and usage rights before publication.
