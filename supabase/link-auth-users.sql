-- Link auth users to FSM profiles
-- Run this AFTER running migrations and seed data

UPDATE fsm_profiles 
SET user_id = 'bb125db8-e6e7-4f32-af66-523186c2d47e' 
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE fsm_profiles 
SET user_id = '53561f57-cf37-4ab7-ad1c-4e98c42a7ffc' 
WHERE id = '10000000-0000-0000-0000-000000000002';

UPDATE fsm_profiles 
SET user_id = '74d039a6-2f50-4ee4-a976-5f2dbe716211' 
WHERE id = '10000000-0000-0000-0000-000000000003';

UPDATE fsm_profiles 
SET user_id = '9355bf41-3c94-4175-8f40-d5baf1abe429' 
WHERE id = '10000000-0000-0000-0000-000000000004';

UPDATE fsm_profiles 
SET user_id = '0d5964d0-f245-4678-b992-cd2dd0be0099' 
WHERE id = '10000000-0000-0000-0000-000000000005';

UPDATE fsm_profiles 
SET user_id = '05e77a1d-9eba-4d8e-953a-08d700d88236' 
WHERE id = '10000000-0000-0000-0000-000000000006';
